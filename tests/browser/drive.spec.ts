import { test, expect, type Page } from "@playwright/test";
async function enter(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
  await page.getByRole("button", { name: "Yahin Chalao" }).click();
  await page.getByRole("button", { name: "Drive Mumbai" }).click();
  await page.getByRole("button", { name: "Chal Chala", exact: true }).click();
  await expect(page.locator(".game")).toHaveAttribute("data-status", "driving");
}

test("Mumbai drive: motion, steering, pause, reset, results, replay and home", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
  await page.getByRole("button", { name: "Delhi", exact: true }).click();
  await expect(page.getByRole("button", { name: "Drive Mumbai" })).toHaveCount(
    0,
  );
  await expect(
    page.getByText("Delhi is coming soon.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mumbai", exact: true }).click();
  await page.getByRole("button", { name: "Yahin Chalao" }).click();
  await page.getByRole("button", { name: "Drive Mumbai" }).click();
  await page.getByRole("button", { name: "Chal Chala", exact: true }).click();
  const game = page.locator(".game");
  await page.keyboard.down("w");
  await expect
    .poll(async () => Number(await game.getAttribute("data-distance")))
    .toBeGreaterThan(5);
  await page.keyboard.up("w");
  const before = await game.getAttribute("data-position");
  await page.keyboard.down("d");
  await page.waitForTimeout(500);
  await page.keyboard.up("d");
  expect(await game.getAttribute("data-position")).not.toBe(before);
  await page.keyboard.press("Escape");
  await expect(game).toHaveAttribute("data-status", "paused");
  const paused = await game.getAttribute("data-distance");
  await page.waitForTimeout(500);
  expect(await game.getAttribute("data-distance")).toBe(paused);
  await page
    .getByRole("button", { name: "Reset vehicle", exact: true })
    .click();
  await expect(game).toHaveAttribute("data-status", "driving");
  await expect
    .poll(async () => Number(await game.getAttribute("data-speed")))
    .toBe(0);
  await page.getByRole("button", { name: "Enable sound" }).click();
  await expect(page.getByRole("button", { name: "Mute sound" })).toBeVisible();
  await page.getByRole("button", { name: "Horn", exact: true }).click();
  await expect(page.getByText("Horn OK please!")).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(game).toHaveAttribute("data-status", "paused");
  await page.getByRole("button", { name: "End drive" }).click();
  await expect(
    page.getByRole("heading", { name: "Badiya drive!" }),
  ).toBeVisible();
  expect(
    Number(
      await page.evaluate(() => localStorage.getItem("bkr:mumbai:auto:best")),
    ),
  ).toBeGreaterThan(5);
  await page.getByRole("button", { name: "Phir Se" }).click();
  await page.getByRole("button", { name: "Chal Chala", exact: true }).click();
  await expect
    .poll(async () => Number(await game.getAttribute("data-distance")))
    .toBe(0);
  await page.getByRole("button", { name: "Pause drive" }).click();
  await page.getByRole("button", { name: "Back to home" }).click();
  await expect(
    page.getByRole("button", { name: "Mera Bap Ka Rasta" }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("mobile: simultaneous steering and throttle, pointer release, resize", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await enter(page);
  const cdp = await context.newCDPSession(page);
  const throttle = await page
    .getByRole("button", { name: "Accelerate", exact: true })
    .boundingBox();
  const steer = await page
    .getByRole("button", { name: "Steer right", exact: true })
    .boundingBox();
  if (!throttle || !steer) throw Error("Missing mobile controls");
  const point = (b: typeof throttle, id: number) => ({
    x: b!.x + b!.width / 2,
    y: b!.y + b!.height / 2,
    id,
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point(throttle, 1), point(steer, 2)],
  });
  await expect
    .poll(async () =>
      Number(await page.locator(".game").getAttribute("data-speed")),
    )
    .toBeGreaterThan(4);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  const speed = Number(await page.locator(".game").getAttribute("data-speed"));
  await expect
    .poll(async () =>
      Number(await page.locator(".game").getAttribute("data-speed")),
    )
    .toBeLessThan(speed);
  await page.getByRole("button", { name: "Pause drive" }).click();
  await page
    .getByRole("button", { name: "Reset vehicle", exact: true })
    .click();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(
    page.getByRole("button", { name: "Accelerate", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.screenshot({ path: "test-results/mumbai-mobile-landscape.png" });
  await context.close();
});

test("graphics context loss pauses and can restart the drive", async ({
  page,
}) => {
  await enter(page);
  await page.locator("canvas").evaluate((canvas) => {
    const gl = (canvas as HTMLCanvasElement).getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(
    page.getByRole("heading", { name: "A little roadblock." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retry drive" }).click();
  await expect(
    page.getByRole("button", { name: "Chal Chala", exact: true }),
  ).toBeVisible();
});
