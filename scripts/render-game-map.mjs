import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
});
const page = await browser.newPage({
  viewport: { width: 1600, height: 1600 },
  deviceScaleFactor: 1,
});
await page.setContent(
  "<style>body{margin:0}svg{display:block;width:1600px;height:1600px}</style>" +
    (await readFile("docs/maps/mumbai-game-map.svg", "utf8")),
);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "docs/maps/mumbai-game-map.png" });
await browser.close();
