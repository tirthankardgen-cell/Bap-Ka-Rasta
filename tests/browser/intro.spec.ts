import { test, expect } from "@playwright/test";

test("opening pauses, resumes and hands over to driving without voice assets", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const errors: string[] = [],
    voices: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().includes("/voices/")) voices.push(r.url());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
  await page.getByRole("button", { name: "Yahin Chalao" }).click();
  await page.getByRole("button", { name: "Drive Mumbai" }).click();
  await page.getByRole("button", { name: "Chal Chala", exact: true }).click();
  await page.keyboard.press("Escape");
  const game = page.locator(".game");
  await expect(game).toHaveAttribute("data-status", "paused");
  const stage = await game.getAttribute("data-stage");
  expect(stage).not.toBe("done");
  await page.getByRole("button", { name: "Standard graphics" }).click();
  await page.waitForTimeout(300);
  await expect(game).toHaveAttribute("data-stage", stage!);
  await page.addStyleTag({ content: ".game-overlay { visibility: hidden; }" });
  await page.screenshot({ path: "test-results/mumbai-opening.png" });
  await page.addStyleTag({ content: ".game-overlay { visibility: visible; }" });
  await page.getByRole("button", { name: "Resume drive" }).click();
  await expect(game).toHaveAttribute("data-stage", "done", { timeout: 60_000 });
  await expect(
    page.getByRole("button", { name: "Accelerate", exact: true }),
  ).toBeVisible();
  await expect(game).toHaveAttribute("data-distance", "0.00");
  expect(
    Number(await page.locator("canvas").getAttribute("data-character-count")),
  ).toBeGreaterThan(738);
  await page.keyboard.down("w");
  await expect
    .poll(async () => Number(await game.getAttribute("data-speed")), {
      timeout: 30_000,
    })
    .toBeGreaterThan(2);
  await page.keyboard.up("w");
  await page.getByRole("button", { name: "Pause drive" }).click();
  expect(voices).toEqual([]);
  expect(errors).toEqual([]);
});

test("mobile reduced-motion intro can skip directly to a stationary drive", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
  await page.getByRole("button", { name: "Yahin Chalao" }).click();
  await page.getByRole("button", { name: "Drive Mumbai" }).click();
  await page.getByRole("button", { name: "Chal Chala", exact: true }).click();
  await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(page.locator(".game")).toHaveAttribute("data-stage", "done");
  await expect(page.locator(".game")).toHaveAttribute("data-speed", "0.00");
  await expect(
    page.getByRole("button", { name: "Change camera view" }),
  ).toBeEnabled();
  await expect(page.getByRole("button", { name: "Skip intro" })).toHaveCount(0);
  await page.getByRole("button", { name: "Pause drive" }).click();
  await page.getByRole("button", { name: "End drive" }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
});
