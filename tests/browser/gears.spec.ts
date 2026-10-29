import { test, expect } from "@playwright/test";
test.use({ hasTouch: true, viewport: { width: 844, height: 390 } });
test("gears support keyboard, numpad and mobile buttons without changing speed instantly", async ({
  page,
}) => {
  test.setTimeout(150000);
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = () =>
      Promise.reject(new Error("Inline layout check"));
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
  await page.getByRole("button", { name: "Yahin Chalao" }).click();
  await page.getByRole("button", { name: "Drive Mumbai" }).click();
  await page
    .getByRole("button", { name: "Drive without intro", exact: true })
    .click();
  const game = page.locator(".game");
  await expect(game).toHaveAttribute("data-gear", "1");
  await page.getByRole("button", { name: "Pause drive" }).click();
  await page.getByRole("button", { name: "Standard graphics" }).click();
  await page.getByRole("button", { name: "Resume drive" }).click();
  await page.keyboard.press("Digit2");
  await expect(game).toHaveAttribute("data-gear", "2");
  await page.keyboard.press("Numpad4");
  await expect(game).toHaveAttribute("data-gear", "4");
  await page
    .getByRole("button", { name: "Gear 3, up to 45 km/h", exact: true })
    .tap();
  await expect(game).toHaveAttribute("data-gear", "3");
  expect(Number(await game.getAttribute("data-speed"))).toBe(0);
  await expect(
    page.getByRole("button", { name: "Gear 3, up to 45 km/h", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Reset vehicle" }).tap();
  await expect(game).toHaveAttribute("data-gear", "1");
  // All interaction checks are complete. Hold animation for DOM-only layout checks
  // so software WebGL does not dominate each geometry measurement.
  await page.evaluate(() => {
    window.requestAnimationFrame = () => 0;
  });
  for (const size of [
    { width: 844, height: 390 },
    { width: 568, height: 320 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size);
    const [gear, pedals, steering] = await page.evaluate(() =>
      [".gear-selector", ".pedals", ".steering"].map((selector) => {
        const r = document.querySelector(selector)!.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }),
    );
    expect(gear.x).toBeGreaterThanOrEqual(0);
    expect(gear.y).toBeGreaterThanOrEqual(0);
    expect(gear.x + gear.width).toBeLessThanOrEqual(size.width + 1);
    expect(gear.y + gear.height).toBeLessThanOrEqual(size.height + 1);
    for (const other of [pedals, steering]) {
      const overlapX =
        Math.min(gear.x + gear.width, other.x + other.width) -
        Math.max(gear.x, other.x);
      const overlapY =
        Math.min(gear.y + gear.height, other.y + other.height) -
        Math.max(gear.y, other.y);
      expect(overlapX <= 0 || overlapY <= 0).toBe(true);
    }
  }
  await page.screenshot({ path: "test-results/mobile-gears.png" });
});
