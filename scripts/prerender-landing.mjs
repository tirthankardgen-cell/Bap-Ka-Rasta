import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Render the same component the browser hydrates. Gameplay stays client-only.
const server = await createServer({
  configFile: false,
  root,
  plugins: [react()],
  // This server renders components only; archived tools are not browser entries.
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { default: Landing } = await server.ssrLoadModule("/src/Landing.tsx");
  const markup = renderToString(createElement(Landing, { onStart() {} }));
  const file = path.join(root, "dist/index.html");
  const html = await readFile(file, "utf8");
  const placeholder = '<div id="root"></div>';
  assert(html.includes(placeholder), "The production root must be empty before prerendering");
  assert(markup.includes('id="hero-title"') && markup.includes("/images/landing-hero.webp"));
  await writeFile(file, html.replace(placeholder, () => `<div id="root" data-prerendered="true">${markup}</div>`));
  // Publish real game information without loading the game engine or requiring JS.
  const { default: GameGuide } = await server.ssrLoadModule("/src/GameGuide.tsx");
  const guideUrl = "https://rasta.vihar.online/guide.html";
  const title = "Bap Ka Rasta — Game World, Cities, Vehicles and Controls";
  const description = "Explore Bap Ka Rasta’s playable Mumbai auto rickshaw game, planned cities and vehicles, characters, landmarks, controls, images and audio credits.";
  function searchHead(url, pageTitle, pageDescription) {
    let head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
      .replace(/<link\b[^>]*rel="(?:stylesheet|modulepreload)"[^>]*>/g, "")
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${pageTitle}</title>`)
      .replace(/<link\b[^>]*rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);
    for (const [field, content] of [["description", pageDescription], ["og:title", pageTitle], ["twitter:title", pageTitle], ["og:description", pageDescription], ["twitter:description", pageDescription], ["og:url", url]]) {
      head = head.replace(new RegExp(`<meta\\b[^>]*(?:name|property)="${field}"[^>]*>`), (tag) => tag.replace(/content="[^"]*"/, `content="${content}"`));
    }
    const schema = JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: pageTitle, description: pageDescription, url, isPartOf: { "@type": "WebSite", name: "Bap Ka Rasta", url: "https://rasta.vihar.online/" }, about: { "@type": "VideoGame", name: "Bap Ka Rasta", url: "https://rasta.vihar.online/" } }).replaceAll("<", "\\u003c");
    return `${head}<script type="application/ld+json">${schema}</script>`;
  }
  const guide = `<!doctype html><html lang="en-IN"><head>${searchHead(guideUrl, title, description)}<link rel="stylesheet" href="/guide.css"></head><body>${renderToStaticMarkup(createElement(GameGuide))}</body></html>\n`;
  await writeFile(path.join(root, "dist/guide.html"), guide);
  await copyFile(path.join(root, "node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2"), path.join(root, "dist/guide-font.woff2"));
  for (const [filePath, urlPath, pageTitle, pageDescription] of [
    ["audio/credits.html", "/audio/credits.html", "Bap Ka Rasta — Audio Credits", "Sources, licences and processing credits for Bap Ka Rasta’s street recordings and generated Mumbai character voices."],
    ["audio/mumbai/voices/index.html", "/audio/mumbai/voices/", "Bap Ka Rasta — Mumbai Dialogue and Voice Previews", "Listen to Mumbai character voices, read Hindi and Marathi dialogue with English translations, and see voice attribution for Bap Ka Rasta."],
  ]) {
    const assetPath = path.join(root, "dist", filePath);
    const source = await readFile(assetPath, "utf8");
    const body = source.slice(source.indexOf("<body"));
    assert(body.startsWith("<body"), filePath + " must have a body");
    const styles = source.match(/<style\b[^>]*>[\s\S]*?<\/style>/g)?.join("\n") || "";
    await writeFile(assetPath, `<!doctype html><html lang="en"><head>${searchHead("https://rasta.vihar.online" + urlPath, pageTitle, pageDescription)}${styles}</head>${body}`);
  }
  console.log("Prerendered the playable game's landing screen, images and launch control.");
  console.log("Published the static game guide with all cities, vehicles, characters, landmarks and credits.");
} finally {
  await server.close();
}
