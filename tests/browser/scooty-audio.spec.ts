import { test, expect } from "@playwright/test";

test("scooty plays its engine and horn, suspends on mute/pause and closes on exit", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  const audioFiles: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("/audio/mumbai/")) audioFiles.push(new URL(request.url()).pathname);
  });
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    const state = { contexts: [] as AudioContext[], loopDurations: [] as number[], beeps: 0 };
    Object.assign(window, { scooterAudio: state });
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options);
        state.contexts.push(this);
      }
      createBufferSource() {
        const source = super.createBufferSource();
        const start = source.start.bind(source);
        source.start = (...args: Parameters<AudioBufferSourceNode["start"]>) => {
          if (source.loop && source.buffer) state.loopDurations.push(source.buffer.duration);
          if (!source.loop && source.buffer && source.buffer.duration < 0.6) state.beeps++;
          start(...args);
        };
        return source;
      }
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Mera Bap Ka Rasta" }).click();
  await page.getByRole("button", { name: "Yahin Chalao" }).click();
  await page.getByRole("button", { name: "Scooty", exact: true }).click();
  await page.getByRole("button", { name: "Drive Mumbai" }).click();
  await page.getByRole("button", { name: "Chal Chala", exact: true }).click();
  await expect(page.locator(".game")).toHaveAttribute("data-status", "driving");
  await expect(page.locator("canvas")).toHaveAttribute("data-audio-status", "ready");
  expect(audioFiles).toContain("/audio/mumbai/scooty-engine.mp3");
  expect(audioFiles).toContain("/audio/mumbai/scooty-horn.mp3");
  expect(audioFiles).toContain("/audio/mumbai/horn.mp3"); // Separate traffic horn.
  expect(audioFiles).not.toContain("/audio/mumbai/engine.mp3");
  const read = () => page.evaluate(() => {
    const state = (window as unknown as { scooterAudio: { contexts: AudioContext[]; loopDurations: number[]; beeps: number } }).scooterAudio;
    return { states: state.contexts.map((context) => context.state), loops: state.loopDurations, beeps: state.beeps };
  });
  await expect.poll(async () => (await read()).states).toEqual(["running"]);
  expect((await read()).loops.some((duration) => duration > 3 && duration < 4)).toBe(true);
  const before = (await read()).beeps;
  await page.getByRole("button", { name: "Horn", exact: true }).click();
  await expect.poll(async () => (await read()).beeps).toBe(before + 1);
  await page.getByRole("button", { name: "Mute sound" }).click();
  await expect.poll(async () => (await read()).states).toEqual(["suspended"]);
  await page.getByRole("button", { name: "Enable sound" }).click();
  await expect.poll(async () => (await read()).states).toEqual(["running"]);
  await page.getByRole("button", { name: "Pause drive" }).click();
  await expect.poll(async () => (await read()).states).toEqual(["suspended"]);
  await page.getByRole("button", { name: "Resume drive" }).click();
  await expect.poll(async () => (await read()).states).toEqual(["running"]);
  await page.getByRole("button", { name: "Pause drive" }).click();
  await page.getByRole("button", { name: "End drive" }).click();
  await expect(page.getByRole("button", { name: "Mera Bap Ka Rasta" })).toBeVisible();
  await expect.poll(async () => (await read()).states).toEqual(["closed"]);
  expect(errors).toEqual([]);
});
