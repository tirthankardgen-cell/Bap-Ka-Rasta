import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4175",
    viewport: { width: 960, height: 640 },
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: ["--enable-unsafe-swiftshader"],
    },
  },
  webServer: [
    {
      command: "npm run preview -- --port 4175",
      url: "http://127.0.0.1:4175",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev -- --port 4176",
      url: "http://127.0.0.1:4176",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
