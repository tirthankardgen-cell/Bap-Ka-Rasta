import { test, expect } from "@playwright/test";
async function enter(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
  await page.getByRole("button", { name: "Yahin Chalao" }).click();
  await page.getByRole("button", { name: "Drive Mumbai" }).click();
}
test("failed game chunk offers reload and home instead of endless loading", async ({
  page,
}) => {
  await page.route(/\/assets\/Game-.*\.js$/, (route) => route.abort());
  await enter(page);
  await expect(page.getByRole("button", { name: "Reload game" })).toBeVisible();
  await page.getByRole("button", { name: "Ghar chalo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Mera Bap Ka Rasta" }),
  ).toBeVisible();
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
  await page.getByRole("button", { name: "Ghar chalo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Mera Bap Ka Rasta" }),
  ).toBeVisible();
});
