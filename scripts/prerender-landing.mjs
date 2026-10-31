import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Render the same component the browser hydrates. Gameplay stays client-only.
const server = await createServer({
  configFile: false,
  root,
  plugins: [react()],
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
  console.log("Prerendered the playable game's landing screen, images and launch control.");
} finally {
  await server.close();
}
