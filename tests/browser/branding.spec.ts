import { test, expect } from "@playwright/test";

test("landing content is crawlable before JavaScript and hydrates into selection", async ({ page, request, browser }) => {
  const response = await request.get("/");
  const html = await response.text();
  expect(html).toContain('data-prerendered="true"');
  expect(html).toContain('id="hero-title"');
  expect(html).toContain('src="/images/landing-hero.webp"');
  expect(html).toContain('href="https://rasta.vihar.online/"');
  expect(html).not.toContain("bap-ka-rasta.vercel.app");
  expect(await (await request.get("/robots.txt")).text()).toContain("https://rasta.vihar.online/sitemap.xml");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<image:loc>https://rasta.vihar.online/images/landing-hero.webp</image:loc>");
  expect(sitemap).not.toContain("bap-ka-rasta.vercel.app");

  const noJs = await browser.newContext({ javaScriptEnabled: false });
  try {
    const staticPage = await noJs.newPage();
    await staticPage.goto("http://127.0.0.1:4175/");
    await expect(staticPage.locator("#hero-title")).toBeVisible();
    await expect(staticPage.locator(".hero-art")).toBeVisible();
  } finally { await noJs.close(); }

  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
  await expect(page.getByRole("button", { name: /Yahin Chalao/ })).toBeVisible();
  expect(errors).toEqual([]);
});

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
    "https://rasta.vihar.online/brand/og-cover.png",
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
