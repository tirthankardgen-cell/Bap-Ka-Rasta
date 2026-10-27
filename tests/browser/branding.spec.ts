import { test, expect } from "@playwright/test";

test("BR metadata, social cover, favicon and orientation-flexible manifest are public and consistent", async ({
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
  expect(manifest.orientation).toBe("any");
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
