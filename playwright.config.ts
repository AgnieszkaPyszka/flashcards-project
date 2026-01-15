import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.test if it exists
try {
  const envPath = path.resolve(process.cwd(), ".env.test");
  if (require('fs').existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log("Loaded environment variables from .env.test");
  } else {
    console.log(".env.test file not found, using process.env variables");
  }
} catch (error) {
  console.error("Error loading .env.test:", error);
}

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"; // <-- domyślnie 3000, zmień jeśli chcesz inny port

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    //{
    //name: "authenticated",
    //use: {
    //  ...devices["Desktop Chrome"],
    //   storageState: "playwright/.auth/state.json",
    //  },
    //},
  ],

  webServer: {
    command: "npm run dev:e2e",
    url: BASE_URL, // use env-driven URL
    reuseExistingServer: process.env.CI ? false : true,
    timeout: 120_000, // 2 minuty na start
    cwd: path.resolve(__dirname),
  },
});
