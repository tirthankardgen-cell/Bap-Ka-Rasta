import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = process.env.VERIFY_SITE_URL || "http://127.0.0.1:4181";
const canonical = "https://rasta.vihar.online";
const routes = ["/", "/guide.html", "/audio/credits.html", "/audio/mumbai/voices/"];
const server = process.env.VERIFY_SITE_URL ? undefined : spawn(process.execPath, [fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url)), "preview", "--host", "127.0.0.1", "--port", "4181", "--strictPort"], { cwd: root, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
let log = "";
let spawnError;
server?.stdout.on("data", (chunk) => { log += chunk; });
server?.stderr.on("data", (chunk) => { log += chunk; });
server?.on("error", (error) => { spawnError = error; });
const get = (route, userAgent = "Googlebot") => fetch(new URL(route, base), { headers: { "User-Agent": userAgent }, signal: AbortSignal.timeout(20000) });
const attribute = (html, tag, key, value, target = "content") => html.match(new RegExp(`<${tag}\\b[^>]*${key}="${value}"[^>]*>`, "i"))?.[0].match(new RegExp(`${target}="([^"]*)"`))?.[1];

try {
  if (server) {
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (spawnError) throw spawnError;
      if (server.exitCode !== null) throw new Error(log);
      if (log.includes("127.0.0.1:4181")) { ready = true; break; }
      await delay(250);
    }
    assert(ready, "Preview server did not start: " + log);
  }
  const pages = new Map();
  const titles = new Set();
  const localAssets = new Set();
  localAssets.add("/guide-font.woff2");
  for (const route of routes) {
    const response = await get(route);
    assert.equal(response.status, 200, route);
    assert(response.headers.get("content-type")?.includes("text/html"), route + " must serve HTML");
    assert(!/noindex|noimageindex/i.test(response.headers.get("x-robots-tag") || ""), route + " must permit indexing");
    const html = await response.text();
    const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1];
    assert(head, route + " needs an explicit head");
    pages.set(route, html);
    const title = head.match(/<title>(.*?)<\/title>/)?.[1];
    assert(title && !titles.has(title), route + " needs a unique title");
    titles.add(title);
    assert(attribute(head, "meta", "name", "description"), route + " description");
    assert.equal(attribute(head, "link", "rel", "canonical", "href"), canonical + route);
    assert(!attribute(head, "meta", "name", "robots")?.includes("noindex"));
    assert.equal(attribute(head, "link", "rel", "icon", "href"), "/brand/icon-192.png");
    assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, route + " heading");
    for (const match of html.matchAll(/(?:href|src)="(\/(?!\/)[^"]+)"/g)) {
      const url = new URL(match[1].replaceAll("&amp;", "&"), base);
      localAssets.add(url.pathname + url.search);
    }
    for (const match of head.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) assert.equal(JSON.parse(match[1])["@context"], "https://schema.org");
  }
  assert(pages.get("/").includes('data-prerendered="true"'), "Homepage must render before JavaScript");
  assert(pages.get("/").includes('href="/guide.html"'), "Guide must be discoverable from the homepage");
  const guide = pages.get("/guide.html");
  assert(!/<script\b[^>]*\bsrc=/.test(guide), "Guide must work without application JavaScript");
  for (const name of ["Mumbai", "Delhi", "Kolkata", "Chennai", "Bangalore", "Auto rickshaw", "Thar", "Fortuner", "Scooty", "KTM", "Toto e-rickshaw", "Sachin", "Meera Tai", "Gateway of India", "Antilia", "Taj Mahal Palace"]) assert(guide.includes(name), "Missing public game information: " + name);
  for (const route of routes) if (route !== "/guide.html") assert(guide.includes(`href="${route}"`), "Guide must link to " + route);
  const robots = await (await get("/robots.txt")).text();
  assert.match(robots, /Allow: \//);
  assert(!/Disallow: \/(?:\s|$)/.test(robots));
  assert(robots.includes(canonical + "/sitemap.xml"));
  const sitemap = await (await get("/sitemap.xml")).text();
  const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(locations.sort(), routes.map((route) => canonical + route).sort());
  const imageLocations = [...sitemap.matchAll(/<image:loc>(.*?)<\/image:loc>/g)].map((match) => new URL(match[1]));
  for (const url of imageLocations) {
    assert.equal(url.origin, canonical);
    localAssets.add(url.pathname);
  }
  for (const route of localAssets) {
    const response = await get(route, "Googlebot-Image");
    assert.equal(response.status, 200, "Broken crawler link or asset: " + route);
    const contentType = response.headers.get("content-type") || "";
    const pathname = new URL(route, base).pathname;
    if (/\.(?:png|webp|svg|ico)$/.test(pathname)) assert(contentType.startsWith("image/"), "Image link must not return fallback HTML: " + route);
    if (pathname.endsWith(".css")) assert(contentType.startsWith("text/css"), route + " stylesheet");
    if (pathname.endsWith(".woff2")) assert(contentType.includes("woff2"), route + " font");
    assert(!/noindex|noimageindex/i.test(response.headers.get("x-robots-tag") || ""));
    await response.body?.cancel();
  }
  const favicon = await get("/brand/icon-192.png", "Googlebot-Image");
  assert(favicon.headers.get("content-type")?.startsWith("image/png"));
  const png = Buffer.from(await favicon.arrayBuffer());
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png.readUInt32BE(16), 192);
  assert.equal(png.readUInt32BE(20), 192);
  console.log(`PASS: four public pages, prerendered landing, static game guide, unique metadata/canonicals, Googlebot-Image favicon, sitemap and ${localAssets.size} linked pages/assets (${base}).`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (server && server.exitCode === null) {
    const stopped = once(server, "exit");
    server.kill();
    await Promise.race([stopped, delay(5000)]);
    if (server.exitCode === null && server.signalCode === null) server.kill("SIGKILL");
  }
}
