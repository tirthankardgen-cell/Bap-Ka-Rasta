import { test, expect, type Page } from "@playwright/test";
async function enter(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
  await page.getByRole("button", { name: "Yahin Chalao" }).click();
  await page.getByRole("button", { name: "Drive Mumbai" }).click();
  await page
    .getByRole("button", { name: "Drive without intro", exact: true })
    .click();
  await expect(page.locator(".game")).toHaveAttribute("data-status", "driving");
}

test("Mumbai drive: motion, steering, pause, reset, exit, fresh drive and home", async ({
  page,
}) => {
  // Software WebGL advances the fixed-step simulation more slowly in this dense scene.
  test.setTimeout(150_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    (window as unknown as { audioStarts: number }).audioStarts = 0;
    (window as unknown as { audioContexts: AudioContext[] }).audioContexts = [];
    window.AudioContext = class extends Native {
      createBufferSource() {
        const source = super.createBufferSource(),
          start = source.start.bind(source);
        source.start = (
          ...args: Parameters<AudioBufferSourceNode["start"]>
        ) => {
          (window as unknown as { audioStarts: number }).audioStarts++;
          start(...args);
        };
        return source;
      }
      constructor(options?: AudioContextOptions) {
        super(options);
        (
          window as unknown as { audioContexts: AudioContext[] }
        ).audioContexts.push(this);
      }
    };
  });
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
  await page
    .getByRole("button", { name: "Drive without intro", exact: true })
    .click();
  const game = page.locator(".game");
  const speedBounds = await page.locator(".speedometer").boundingBox();
  const gameBounds = await game.boundingBox();
  expect(
    Math.abs(
      speedBounds!.x +
        speedBounds!.width / 2 -
        (gameBounds!.x + gameBounds!.width / 2),
    ),
  ).toBeLessThan(2);
  expect(speedBounds!.y - gameBounds!.y).toBeLessThan(30);
  expect(
    await page
      .locator(".speedometer")
      .evaluate((el) => getComputedStyle(el).backdropFilter),
  ).toContain("blur");
  await expect(page.locator(".mini-map")).toHaveCount(0);
  await expect(page.getByText(/AREAS|LOCAL BEST/)).toHaveCount(0);
  expect(
    Number(await page.locator("canvas").getAttribute("data-traffic-count")),
  ).toBeGreaterThanOrEqual(100);

  // Exercise the lower-cost graphics path for extended controls on software WebGL.
  // The mobile and context-recovery flows keep Standard graphics enabled.
  await page.getByRole("button", { name: "Pause drive" }).click();
  await page.getByRole("button", { name: "Standard graphics" }).click();
  await expect(
    page.getByRole("button", { name: "Low graphics" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resume drive" }).click();
  await page.keyboard.down("w");
  await expect
    .poll(async () => Number(await game.getAttribute("data-distance")), {
      timeout: 40_000,
    })
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
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { audioContexts: AudioContext[] }).audioContexts
          .length,
    ),
  ).toBe(1);
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-audio-status",
    "ready",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { audioContexts: AudioContext[] })
            .audioContexts[0].state,
      ),
    )
    .toBe("running");
  await page.getByRole("button", { name: "Mute sound" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { audioContexts: AudioContext[] })
            .audioContexts[0].state,
      ),
    )
    .toBe("suspended");
  await page.getByRole("button", { name: "Enable sound" }).click();
  await expect(page.getByRole("button", { name: "Mute sound" })).toBeVisible();
  await page.getByRole("button", { name: "Horn", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { audioStarts: number }).audioStarts,
      ),
    )
    .toBe(4);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(game).toHaveAttribute("data-status", "paused");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { audioContexts: AudioContext[] })
            .audioContexts[0].state,
      ),
    )
    .toBe("suspended");
  await page.getByRole("button", { name: "End drive" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { audioContexts: AudioContext[] })
            .audioContexts[0].state,
      ),
    )
    .toBe("closed");
  await expect(
    page.getByRole("button", { name: "Mera Bap Ka Rasta" }),
  ).toBeVisible();
  await enter(page);
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
  test.setTimeout(150_000);
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
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
  await page.setViewportSize({ width: 915, height: 412 });
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
    page.getByRole("heading", { name: "Arre, chhota sa panga!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retry drive" }).click();
  await expect(
    page.getByRole("button", { name: "Chal Chala", exact: true }),
  ).toBeVisible();
});

test("three camera views switch by keyboard and button without resetting the drive", async ({
  page,
}) => {
  test.setTimeout(150_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await enter(page);
  await page.getByRole("button", { name: "Pause drive" }).click();
  await page.getByRole("button", { name: "Standard graphics" }).click();
  await page.getByRole("button", { name: "Resume drive" }).click();
  const canvas = page.locator("canvas"),
    game = page.locator(".game");
  const position = await game.getAttribute("data-position");
  await expect(canvas).toHaveAttribute("data-camera-mode", "third-person");
  await page.keyboard.press("c");
  await expect(canvas).toHaveAttribute("data-camera-mode", "behind-driver");
  await page.getByRole("button", { name: "Pause drive" }).click();
  // Freeze the scene for consistent camera previews; hide only the pause panel.
  await page.addStyleTag({ content: ".game-overlay { visibility: hidden; }" });
  await page.screenshot({ path: "test-results/camera-behind-driver.png" });
  await page.getByRole("button", { name: "Change camera view" }).click();
  await expect(canvas).toHaveAttribute("data-camera-mode", "driver");
  await page.screenshot({ path: "test-results/camera-driver.png" });
  await page.getByRole("button", { name: "Change camera view" }).click();
  await expect(canvas).toHaveAttribute("data-camera-mode", "third-person");
  await page.screenshot({ path: "test-results/camera-third-person.png" });
  expect(await game.getAttribute("data-position")).toBe(position);
  expect(errors).toEqual([]);
});
