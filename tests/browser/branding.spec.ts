import { test, expect } from "@playwright/test";

test("BR metadata, social cover, favicon and landscape manifest are public and consistent", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.locator(".brand-mark")).toHaveAttribute(
    "src",
    "/brand/br-mark.svg",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://bap-ka-rasta.vercel.app/brand/og-cover.png",
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  const manifest = await (await request.get("/site.webmanifest")).json();
  expect(manifest.orientation).toBe("landscape");
  for (const icon of manifest.icons)
    expect((await request.get(icon.src)).ok()).toBe(true);
  const icon = await (await request.get("/favicon.svg")).text();
  expect(icon).toBe(await (await request.get("/brand/br-mark.svg")).text());
  expect((await request.get("/favicon.ico")).ok()).toBe(true);
  const dimensions = await page.evaluate(async () => {
    const img = new Image();
    img.src = "/brand/og-cover.png";
    await img.decode();
    return [img.naturalWidth, img.naturalHeight];
  });
  expect(dimensions).toEqual([1200, 630]);
  expect(
    JSON.parse(
      await page.locator('script[type="application/ld+json"]').innerText(),
    ).name,
  ).toBe("Bap Ka Rasta");
});

test("touch phones must rotate before play and portrait pauses intro and driving", async ({
  browser,
}) => {
  test.setTimeout(210_000);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
  await page.getByRole("button", { name: "Yahin Chalao" }).click();
  await page.getByRole("button", { name: "Drive Mumbai" }).click();
  await expect(
    page.getByRole("dialog", { name: "Phone ghumaao, bhidu." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Chal Chala", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: "test-results/landscape-required.png" });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Chal Chala", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("dialog")).toBeVisible();
  const game = page.locator(".game");
  await expect(game).toHaveAttribute("data-status", "paused");
  const stage = await game.getAttribute("data-stage");
  expect(stage).not.toBe("done");
  const position = await game.getAttribute("data-position");
  await page.waitForTimeout(350);
  await expect(game).toHaveAttribute("data-stage", stage!);
  await expect(game).toHaveAttribute("data-position", position!);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(game).toHaveAttribute("data-status", "paused");
  await page.getByRole("button", { name: "Standard graphics" }).click();
  await page.getByRole("button", { name: "Resume drive" }).click();
  await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(game).toHaveAttribute("data-stage", "done");
  await page.keyboard.down("w");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(game).toHaveAttribute("data-status", "paused");
  await expect(
    page.getByRole("button", { name: "Accelerate", exact: true }),
  ).toHaveCount(0);
  const distance = await game.getAttribute("data-distance");
  await page.waitForTimeout(350);
  await expect(game).toHaveAttribute("data-distance", distance!);
  await page.keyboard.up("w");
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(game).toHaveAttribute("data-status", "paused");
  await page.getByRole("button", { name: "Resume drive" }).click();
  await expect(game).toHaveAttribute("data-status", "driving");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Back to home", exact: true }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
  await context.close();
});
