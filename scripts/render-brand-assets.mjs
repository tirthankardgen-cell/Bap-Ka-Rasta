// Render authored brand layouts and vector originals, without changing source artwork.
// Run after python scripts/build_brand_assets.py. Uses the project's Playwright browser.
import { chromium } from "@playwright/test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = process.cwd();
const data = async (path, mime) =>
  `data:${mime};base64,${(await readFile(resolve(root, path))).toString("base64")}`;
const logo = await data("public/brand/br-mark.svg", "image/svg+xml");
const hero = await data("public/images/landing-hero.webp", "image/webp");
const heading = await data(
  "node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff2",
  "font/woff2",
);
const body = await data(
  "node_modules/@fontsource/dm-sans/files/dm-sans-latin-600-normal.woff2",
  "font/woff2",
);
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
});
const page = await browser.newPage({ deviceScaleFactor: 1 });
await mkdir("public/brand", { recursive: true });
async function render(html, width, height, path, transparent = false) {
  await page.setViewportSize({ width, height });
  await page.setContent(html);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => i.decode()));
  });
  await page.screenshot({ path, omitBackground: transparent });
}
const fonts = `@font-face{font-family:Barlow;src:url('${heading}')}@font-face{font-family:DM;src:url('${body}')}*{box-sizing:border-box}body{margin:0;color:#23281f;font-family:DM,sans-serif}`;
for (const [name, size, source] of [
  ["icon-192.png", 192, "app-icon.svg"],
  ["icon-512.png", 512, "app-icon.svg"],
  ["apple-touch-icon.png", 180, "app-icon.svg"],
  ["maskable-512.png", 512, "maskable-icon.svg"],
  ["favicon-16.png", 16, "br-mark.svg"],
  ["favicon-32.png", 32, "br-mark.svg"],
  ["favicon-48.png", 48, "br-mark.svg"],
  ["br-mark.png", 512, "br-mark.svg"],
]) {
  const src = await data("public/brand/" + source, "image/svg+xml");
  await render(
    `<style>${fonts}img{width:100vw;height:100vh;display:block}</style><img src="${src}">`,
    size,
    size,
    "public/brand/" + name,
    true,
  );
}
for (const [name, w, h, square] of [
  ["og-cover.png", 1200, 630, false],
  ["readme-cover.png", 1600, 700, false],
  ["social-square.png", 1080, 1080, true],
]) {
  const k = w / 1200;
  await render(
    `<style>${fonts}
 body{background:#faf8f0}main{position:relative;width:100vw;height:100vh;overflow:hidden}
 .art{position:absolute;right:0;top:0;width:100%;height:100%;object-fit:cover;object-position:70% 80%}
 .shade{position:absolute;inset:0;background:linear-gradient(90deg,#faf8f0 0%,#faf8f0f5 28%,#faf8f08c 48%,#faf8f000 70%)}
 .copy{position:absolute;inset:7% 5.5%;display:flex;flex-direction:column;align-items:flex-start}
 .mark{width:${70 * k}px;height:${70 * k}px}h1{font-family:Barlow;margin:${24 * k}px 0 ${18 * k}px;font-size:${108 * k}px;line-height:.85;letter-spacing:-1px}h1 span{color:#d99b13}
 .tag{font-size:${22 * k}px;margin:0;line-height:1.45;max-width:42%}.pill{margin-top:${25 * k}px;background:#ffcc37;border:1.5px solid #23281f;border-radius:50px;padding:${10 * k}px ${18 * k}px;font-size:${12 * k}px;letter-spacing:1px}
 .url{margin-top:auto;font-size:${13 * k}px;letter-spacing:.7px}.label{position:absolute;right:4%;top:6%;background:#faf8f0e8;padding:8px 12px;border-radius:5px;font-size:${11 * k}px}
 ${square ? ".art{height:70%;top:30%;object-position:72% 55%}.shade{background:linear-gradient(180deg,#faf8f0 0%,#faf8f0 22%,#faf8f000 55%)}.copy{inset:5%}.mark{width:72px;height:72px}h1{font-size:100px;line-height:.9;margin:22px 0 16px}.tag{max-width:65%;font-size:23px}.pill{margin-top:18px}.url{background:#faf8f0ed;padding:10px;border-radius:5px}" : ""}
 </style><main><img class="art" src="${hero}" alt=""><div class="shade"></div><div class="copy"><img class="mark" src="${logo}" alt="BR"><h1>BAP KA<br>RASTA<span>.</span></h1><p class="tag">Apna sheher.<br>Apni sawaari.</p><span class="pill">PLAY MUMBAI · AUTO RICKSHAW</span><span class="url">bap-ka-rasta.vercel.app</span></div><span class="label">FREE-ROAM BROWSER GAME</span></main>`,
    w,
    h,
    "public/brand/" + name,
  );
}
const faviconParts = await Promise.all(
  [16, 32, 48].map((n) => readFile("public/brand/favicon-" + n + ".png")),
);
const ico = Buffer.alloc(6 + 16 * faviconParts.length);
ico.writeUInt16LE(1, 2);
ico.writeUInt16LE(faviconParts.length, 4);
let offset = ico.length;
faviconParts.forEach((png, i) => {
  const entry = 6 + i * 16,
    size = [16, 32, 48][i];
  ico[entry] = size;
  ico[entry + 1] = size;
  ico.writeUInt16LE(1, entry + 4);
  ico.writeUInt16LE(32, entry + 6);
  ico.writeUInt32LE(png.length, entry + 8);
  ico.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
await writeFile("public/favicon.ico", Buffer.concat([ico, ...faviconParts]));
await browser.close();
console.log("Rendered social covers, README cover, app icons.");
