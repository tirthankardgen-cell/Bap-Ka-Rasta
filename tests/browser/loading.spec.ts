import { test, expect } from "@playwright/test";
async function enter(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
  await page.getByRole("button", { name: "Yahin Chalao" }).click();
  await page.getByRole("button", { name: "Drive Mumbai" }).click();
}
test("failed game chunk offers reload without a home popup button", async ({
  page,
}) => {
  await page.route(/\/assets\/Game-.*\.js$/, (route) => route.abort());
  await enter(page);
  await expect(page.getByRole("button", { name: "Reload game" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ghar chalo", exact: true }),
  ).toHaveCount(0);
});
test("stalled model times out and retry loads the playable scene", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.clock.install();
  await page.route("**/models/mumbai-auto.glb", () => {});
  await enter(page);
  await expect(page.locator(".game .road-loading")).toBeVisible();
  await expect(page.locator(".road-worker")).toHaveCount(2);
  await page.clock.fastForward(31000);
  await expect(page.getByRole("button", { name: "Retry drive" })).toBeVisible();
  await page.unroute("**/models/mumbai-auto.glb");
  await page.getByRole("button", { name: "Retry drive" }).click();
  await expect(
    page.getByRole("button", { name: "Drive without intro", exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  await page
    .getByRole("button", { name: "Drive without intro", exact: true })
    .click();
  await expect(page.locator(".game")).toHaveAttribute("data-status", "driving");
  await expect(page.locator("canvas")).toBeVisible();
});

test("road workers animate while the game code loads and respect reduced motion", async ({
  page,
}) => {
  await page.route(/\/assets\/Game-.*\.js$/, () => {});
  await enter(page);
  await expect(page.getByText("Rasta ban raha hai…")).toBeVisible();
  await expect(page.locator(".road-worker")).toHaveCount(2);
  expect(
    await page
      .locator(".asphalt-strip")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("pave-road");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".asphalt-strip")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.setViewportSize({ width: 667, height: 375 });
  await page.screenshot({ path: "test-results/road-workers-loading.png" });
  await expect(
    page.getByRole("button", { name: "Ghar chalo", exact: true }),
  ).toHaveCount(0);
});

test("worker animation continues while the main thread is busy", async ({
  page,
}) => {
  await page.route("**/models/mumbai-auto.glb", () => {});
  await enter(page);
  await expect(page.locator(".game .road-loading")).toBeVisible();
  await expect(page.locator(".worker-shovel").first()).toBeVisible();
  expect(
    await page
      .locator(".worker-shovel")
      .first()
      .evaluate((el) => el instanceof HTMLElement),
  ).toBe(true);
  const cdp = await page.context().newCDPSession(page);
  const frames: { time: number; data: string }[] = [];
  cdp.on("Page.screencastFrame", (frame) => {
    frames.push({ time: Date.now(), data: frame.data });
    void cdp
      .send("Page.screencastFrameAck", { sessionId: frame.sessionId })
      .catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "png", everyNthFrame: 3 });
  await page.evaluate(() => {
    setTimeout(() => {
      const until = performance.now() + 1600;
      while (performance.now() < until) {
        /* simulate scene generation */
      }
    }, 200);
  });
  const start = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 2100));
  await cdp.send("Page.stopScreencast");
  const busyFrames = frames.filter(
    (f) => f.time > start + 450 && f.time < start + 1500,
  );
  expect(new Set(busyFrames.map((f) => f.data)).size).toBeGreaterThan(1);
});
