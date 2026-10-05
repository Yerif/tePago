import { defineConfig, devices } from "@playwright/test";

const PUERTO = 3100;
const PUERTO_PROD = 3101;

/** Smoke E2E sobre el demo (sin Supabase). Se levanta el build de producción en modo preview, como en Vercel. */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    trace: "retain-on-failure",
    // WebGL por software (SwiftShader): el personaje 3D corre también sin GPU, como en el CI.
    launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] },
  },
  projects: [{ name: "movil-375", use: { ...devices["Pixel 5"], viewport: { width: 375, height: 800 } } }],
  webServer: [
    {
      command: `npm run build && npx next start -p ${PUERTO}`,
      url: `http://localhost:${PUERTO}`,
      env: { VERCEL_ENV: "preview", NEXT_TELEMETRY_DISABLED: "1" },
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
    },
    {
      // Mismo build, pero como producción: `/dev/*` debe dar 404 (se levanta cuando el primero ya compiló).
      command: `npx next start -p ${PUERTO_PROD}`,
      url: `http://localhost:${PUERTO_PROD}`,
      env: { VERCEL_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
