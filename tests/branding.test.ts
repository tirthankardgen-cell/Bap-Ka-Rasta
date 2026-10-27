import { streets } from "../src/game/network.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const file = (path: string) => new URL(`../${path}`, import.meta.url);
const text = (path: string) => readFileSync(file(path), "utf8");

test("favicon uses the same outlined BR master as the landing identity", () => {
  assert.equal(text("public/favicon.svg"), text("public/brand/br-mark.svg"));
  assert.match(text("public/favicon.svg"), /<path/);
  assert.doesNotMatch(text("public/favicon.svg"), /<text/);
  const ico = readFileSync(file("public/favicon.ico"));
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
});

test("social covers and launcher icons have their declared dimensions", () => {
  const sizes: [string, number, number][] = [
    ["og-cover.png", 1200, 630],
    ["readme-cover.png", 1600, 700],
    ["social-square.png", 1080, 1080],
    ["apple-touch-icon.png", 180, 180],
    ["icon-192.png", 192, 192],
    ["icon-512.png", 512, 512],
    ["maskable-512.png", 512, 512],
  ];
  for (const [name, w, h] of sizes) {
    const png = readFileSync(file(`public/brand/${name}`));
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), w, name);
    assert.equal(png.readUInt32BE(20), h, name);
  }
});

test("landscape manifest references real local icons and matches the brand palette", () => {
  const manifest = JSON.parse(text("public/site.webmanifest"));
  assert.equal(manifest.orientation, "landscape");
  assert.equal(manifest.short_name, "BR");
  assert.equal(manifest.theme_color, "#ffcc37");
  for (const icon of manifest.icons)
    assert.ok(existsSync(file(`public${icon.src}`)));
  assert.match(text("index.html"), /og:image:width" content="1200"/);
});

test("branded map documents the playable network rather than municipal wards", () => {
  const map = text("docs/maps/mumbai-game-map.svg");
  assert.match(map, /MUMBAI · GAME MAP/);
  assert.equal(
    new Set([...map.matchAll(/data-street="(\d+)"/g)].map((m) => Number(m[1])))
      .size,
    streets.length,
  );
  assert.match(map, /Boundary buildings/);
  assert.doesNotMatch(map, /DataMeet|municipal ward/);
});
