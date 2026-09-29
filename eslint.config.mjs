import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  { ignores: [".next/**", "node_modules/**", "coverage/**", "src/types/database.ts", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": "error",
      "react/no-danger": "error",
    },
  },
  // Única excepción a no-console (CLAUDE.md §12).
  { files: ["src/lib/logger.ts"], rules: { "no-console": "off" } },
];

export default config;
