import { test, expect } from "@playwright/test";
test("full-screen city and vehicle galleries support arrows, keyboard and back navigation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
  await expect(
    page.getByRole("heading", { name: "Sheher chun." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next city", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Delhi", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Coming soon", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("ArrowLeft");
  await page.getByRole("button", { name: "Yahin Chalao" }).click();
  await expect(
    page.getByRole("heading", { name: "Sawaari chun." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next vehicle", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Thar", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Coming soon", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Previous vehicle", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Drive Mumbai" }),
  ).toBeEnabled();
  await page.screenshot({ path: "test-results/vehicle-gallery-desktop.png" });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "Sheher chun." }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/city-gallery-desktop.png" });
  await page
    .getByRole("button", { name: "Previous city", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Bangalore", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to home" }).click();
  await expect(
    page.getByRole("button", { name: "Mera Bap Ka Rasta" }),
  ).toBeVisible();
});
test("mobile galleries fit the screen and support swipe", async ({ page }) => {
  for (const [width, height] of [
    [390, 844],
    [320, 568],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollHeight <= innerHeight &&
          document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const art = page.locator(".gallery-slide:not([inert]) .gallery-art");
    const box = await art.boundingBox();
    if (!box) throw Error("missing art");
    const x = box.x + box.width * 0.8,
      y = box.y + box.height * 0.5;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 80, y, { steps: 5 });
    await page.mouse.up();
    await expect(
      page.getByRole("heading", { name: "Delhi", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Mumbai", exact: true }).click();
    await page.getByRole("button", { name: "Yahin Chalao" }).click();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollHeight <= innerHeight &&
          document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "Drive Mumbai" }),
    ).toBeInViewport();
    if (width === 390)
      await page.screenshot({
        path: "test-results/vehicle-gallery-mobile.png",
      });
  }
});
