import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.test if it exists
import fs from "fs";

try {
  const envPath = path.resolve(process.cwd(), ".env.test");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    // Environment variables loaded from .env.test
  } else {
    // Using process.env variables
  }
} catch {
  // Error loading .env.test
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
    url: BASE_URL,
    reuseExistingServer: process.env.CI ? false : true,
    timeout: 120_000,
    cwd: path.resolve(__dirname),
    env: {
      PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
      PUBLIC_SUPABASE_KEY: process.env.SUPABASE_KEY,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      E2E_USERNAME_ID: process.env.E2E_USERNAME_ID,
      E2E_USERNAME: process.env.E2E_USERNAME,
      E2E_PASSWORD: process.env.E2E_PASSWORD,
      NODE_ENV: "integration",
      BASE_URL: BASE_URL,
    },
  },
});
