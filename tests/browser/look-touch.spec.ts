import { test, expect } from "@playwright/test";
test.use({ hasTouch: true, viewport: { width: 844, height: 390 } });
test("touch drag looks around without steering the parked auto", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/");
  await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
  await page.getByRole("button", { name: "Yahin Chalao" }).click();
  await page.getByRole("button", { name: "Drive Mumbai" }).click();
  await page
    .getByRole("button", { name: "Drive without intro", exact: true })
    .click();
  const canvas = page.locator("canvas");
  const position = await page.locator(".game").getAttribute("data-position");
  const b = (await canvas.boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const x = b.x + b.width * 0.45,
    y = b.y + b.height * 0.48;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: x + 80, y: y - 20, id: 1 }],
  });
  await expect
    .poll(async () =>
      Math.abs(Number(await canvas.getAttribute("data-look-yaw"))),
    )
    .toBeGreaterThan(0.2);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(canvas).toHaveAttribute("data-look-yaw", "0.000", {
    timeout: 60000,
  });
  expect(await page.locator(".game").getAttribute("data-position")).toBe(
    position,
  );
});
