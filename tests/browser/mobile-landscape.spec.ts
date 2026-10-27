import { test, expect, type Page } from "@playwright/test";
async function withinScreen(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  const viewport = page.viewportSize()!;
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
}
test("phone selection stays landscape without prompts and swipes follow the rotated canvas", async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  for (const [width, height] of [
    [390, 844],
    [320, 568],
    [844, 390],
    [667, 375],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator(".landscape-stage")).toHaveCount(0);
    await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
    const stage = page.locator(".landscape-stage");
    await expect(stage).toHaveAttribute("data-rotated", String(height > width));
    expect(
      await stage.evaluate((e) => e.clientWidth / e.clientHeight),
    ).toBeGreaterThan(1);
    await withinScreen(page, ".selection");
    await withinScreen(
      page,
      '.gallery-slide[aria-hidden="false"] .gallery-confirm',
    );
    await page.getByRole("button", { name: "Yahin Chalao" }).click();
    await withinScreen(page, ".ride-selection");
    await withinScreen(page, ".ride-confirm");
    await withinScreen(page, ".ride-header");
    const box = (await page.locator(".ride-orbit").boundingBox())!;
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y, id: 1 }],
    });
    for (let step = 1; step <= 5; step++)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          {
            x: x - (height > width ? 0 : 14 * step),
            y: y - (height > width ? 14 * step : 0),
            id: 1,
          },
        ],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await cdp.detach();
    await expect(
      page.getByRole("heading", { name: "Thar", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Previous vehicle", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Drive Mumbai" }),
    ).toBeEnabled();
    await page.screenshot({
      path: `test-results/mobile-ride-${width}-${height}.png`,
    });
    await page.getByRole("button", { name: "Back to cities" }).click();
    await page.getByRole("button", { name: "Back to home" }).click();
    await expect(stage).toHaveCount(0);
  }
  await context.close();
});
test("portrait phone can drive on a landscape canvas and turn sideways without an orientation pause", async ({
  browser,
}) => {
  test.setTimeout(180000);
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
  await page.getByRole("button", { name: "Yahin Chalao" }).click();
  await page.getByRole("button", { name: "Drive Mumbai" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Drive without intro", exact: true })
    .click();
  const game = page.locator(".game");
  await expect(game).toHaveAttribute("data-status", "driving");
  expect(
    await page
      .locator(".game-canvas")
      .evaluate((e) => e.clientWidth / e.clientHeight),
  ).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Pause drive" }).click();
  await page.getByRole("button", { name: "Standard graphics" }).click();
  await page.getByRole("button", { name: "Resume drive" }).click();
  await withinScreen(page, ".drive-buttons");
  await withinScreen(page, ".game-top");
  const b = (await page
    .getByRole("button", { name: "Accelerate", exact: true })
    .boundingBox())!;
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2, id: 1 }],
  });
  await expect
    .poll(async () => Number(await game.getAttribute("data-speed")))
    .toBeGreaterThan(4);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator(".landscape-stage")).toHaveAttribute(
    "data-rotated",
    "false",
  );
  await expect(game).toHaveAttribute("data-status", "driving");
  await withinScreen(page, ".drive-buttons");
  await withinScreen(page, ".game-top");
  await page.screenshot({ path: "test-results/mobile-game-landscape.png" });
  await page.getByRole("button", { name: "Pause drive" }).click();
  await page.getByRole("button", { name: "End drive" }).click();
  await expect(page.locator(".landscape-stage")).toHaveCount(0);
  expect(errors).toEqual([]);
  await context.close();
});
