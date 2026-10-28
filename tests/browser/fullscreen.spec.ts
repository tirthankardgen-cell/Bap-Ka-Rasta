import { test, expect } from "@playwright/test";

test.describe("mobile fullscreen", () => {
  test.use({ hasTouch: true, viewport: { width: 844, height: 390 } });
  test("selection enters fullscreen and returning home exits", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.fullscreenElement === document.documentElement,
        ),
      )
      .toBe(true);
    await page.getByRole("button", { name: "Yahin Chalao" }).click();
    await expect(
      page.getByRole("heading", { name: "Sawaari chun." }),
    ).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => !!document.fullscreenElement))
      .toBe(true);
    await page.getByRole("button", { name: "Back to cities" }).click();
    await page.getByRole("button", { name: "Back to home" }).click();
    await expect
      .poll(() => page.evaluate(() => !!document.fullscreenElement))
      .toBe(false);
  });
  test("denied fullscreen still opens city selection", async ({ page }) => {
    await page.addInitScript(() => {
      Element.prototype.requestFullscreen = () =>
        Promise.reject(new Error("Fullscreen unavailable"));
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
    await expect(
      page.getByRole("heading", { name: "Sheher chun." }),
    ).toBeVisible();
  });
});
test("desktop selection does not request fullscreen", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
  expect(await page.evaluate(() => !!document.fullscreenElement)).toBe(false);
});
