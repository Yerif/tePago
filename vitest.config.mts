import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["src/lib/**/*.test.ts"],
    coverage: { provider: "v8", exclude: ["**/*.test.ts", "src/lib/splits/tipos.ts"] },
  },
});
