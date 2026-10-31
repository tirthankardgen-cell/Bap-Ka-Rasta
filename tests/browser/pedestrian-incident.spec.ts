import { test, expect } from "@playwright/test";
test("slow impact scolds without ending the drive", async ({ page }) => {
  await page.goto(
    "http://127.0.0.1:4176/tests/browser/fixtures/incident.html?slow",
  );
  await expect(page.locator(".character-subtitle")).toHaveAttribute(
    "data-clip-id", /_warning_01$/,
    { timeout: 60000 },
  );
  await expect(page.locator(".game")).toHaveAttribute("data-incident", "none");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("serious impact locks controls, captures the scene and returns home from the newspaper", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4176/tests/browser/fixtures/incident.html");
  await expect(page.locator(".game")).toHaveAttribute(
    "data-incident",
    "report",
    { timeout: 90000 },
  );
  const position = await page.locator(".game").getAttribute("data-position");
  await page.keyboard.press("r");
  await page.keyboard.press("c");
  await page.keyboard.down("w");
  await page.waitForTimeout(300);
  await page.keyboard.up("w");
  expect(await page.locator(".game").getAttribute("data-position")).toBe(
    position,
  );
  await expect(page.locator(".game")).toHaveAttribute("data-speed", "0");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("ki jaan gayi");
  await expect(dialog.locator("img")).toHaveAttribute(
    "src",
    /^data:image\/jpeg;base64,/,
  );
  expect(
    await dialog
      .locator("img")
      .evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(100);
  await page.screenshot({
    path: "test-results/pedestrian-newspaper-desktop.png",
  });
  await page.setViewportSize({ width: 667, height: 375 });
  const box = await dialog.boundingBox();
  expect(box!.width).toBeLessThan(667);
  expect(box!.height).toBeLessThanOrEqual(375);
  await page.screenshot({
    path: "test-results/pedestrian-newspaper-mobile.png",
  });
  const restart = page.getByRole("button", { name: "Back to home" });
  await restart.focus();
  await page.keyboard.press("Tab");
  await expect(restart).toBeFocused();
  await restart.click();
  await expect(
    page.getByRole("button", { name: "Mera Bap Ka Rasta" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
