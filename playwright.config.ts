import { defineConfig, devices } from "@playwright/test";

const PUERTO = 3100;

/** Smoke E2E sobre el demo (sin Supabase). Se levanta el build de producción en modo preview, como en Vercel. */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://localhost:${PUERTO}`, trace: "retain-on-failure" },
  projects: [{ name: "movil-375", use: { ...devices["Pixel 5"], viewport: { width: 375, height: 800 } } }],
  webServer: {
    command: `npm run build && npx next start -p ${PUERTO}`,
    url: `http://localhost:${PUERTO}`,
    env: { VERCEL_ENV: "preview", NEXT_TELEMETRY_DISABLED: "1" },
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
