import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "@": root },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "core/**/*.{ts,tsx}",
        "modules/auth/client/api.ts",
        "modules/commerce/client/api.ts",
        "modules/support/client/api.ts",
        "modules/catalog/constants/**/*.ts",
        "modules/customizer/types.ts",
        "modules/orders/client/storage.ts",
        "widgets/catalog/ProductCard.tsx",
      ],
      exclude: ["**/*.test.{ts,tsx}", "**/index.ts", "**/types/index.ts"],
      thresholds: {
        statements: 60,
        branches: 55,
        functions: 55,
        lines: 60,
      },
    },
  },
});
