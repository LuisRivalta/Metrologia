import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode ?? "test", process.cwd(), "");

  return {
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url))
    }
  },
  test: {
    env,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 15_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["lib/**/*.ts"],
      exclude: [
        "lib/api/**",
        "lib/server/**",
        "lib/supabase/**"
      ]
    }
  }
  };
});
