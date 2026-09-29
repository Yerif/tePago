import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";

const CIEN = { lines: 100, branches: 100, functions: 100, statements: 100 };

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["src/lib/**/*.test.ts"],
    coverage: {
      provider: "v8",
      exclude: ["**/*.test.ts", "src/lib/splits/tipos.ts"],
      // 100 % obligatorio en dinero, juego, validación de la IA y el guard de API; el resto solo se reporta.
      thresholds: { "src/lib/splits/**": CIEN, "src/lib/game/**": CIEN, "src/lib/ai/**": CIEN, "src/lib/api/**": CIEN, "src/lib/tiempo.ts": CIEN },
    },
  },
});
