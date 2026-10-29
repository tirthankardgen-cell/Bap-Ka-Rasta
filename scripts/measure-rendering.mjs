import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  args: ["--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.log(e.message));
  await page.goto(
    "http://127.0.0.1:4176/tests/browser/fixtures/performance.html",
  );
  await page.waitForFunction(
    () => document.body.dataset.result,
    {},
    { timeout: 120000 },
  );
  console.log(await page.locator("body").getAttribute("data-result"));
} finally {
  await browser.close();
}
