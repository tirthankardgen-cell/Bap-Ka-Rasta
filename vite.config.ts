import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  // Keep archived research pages and the separate city-preview tool out of startup scanning.
  optimizeDeps: { entries: ["index.html", "tests/browser/fixtures/*.html"] },
});
