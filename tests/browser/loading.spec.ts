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
  await expect(
    page.getByRole("button", { name: "Drive without intro", exact: true }),
  ).toBeDisabled();
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
