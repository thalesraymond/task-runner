import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    reporters: ["default", "junit"],
    outputFile: {
      junit: "test-report.xml",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        statements: 100,
        functions: 100,
        branches: 100,
        lines: 100,
      },
    },
  },
});
