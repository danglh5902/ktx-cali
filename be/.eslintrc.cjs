/**
 * Standalone ESLint config (be/ is deployed independently from fe/, so no
 * shared config package — see docs/11-architecture.md §1.3).
 */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "eslint-config-prettier",
  ],
  env: { node: true, es2022: true },
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/consistent-type-imports": "warn",
    // Chỉ repository được import Drizzle schema trực tiếp — dùng repository
    // để RequestContext/RLS luôn được áp dụng. Xem docs/11-architecture.md §2 D5.
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["**/db/schema/*", "**/db/schema"],
            message:
              "Chỉ repository được import Drizzle schema trực tiếp. Dùng repository để RequestContext/RLS luôn được áp dụng.",
          },
        ],
      },
    ],
  },
  ignorePatterns: ["dist", "node_modules"],
  overrides: [
    {
      // Repositories, tests, DB internals, and the audit writer (which acts
      // as the repository for `audit_logs` specifically) are the sanctioned
      // places to import schema directly.
      files: ["**/*.repository.ts", "**/*.test.ts", "**/db/**", "**/audit/**"],
      rules: { "no-restricted-imports": "off" },
    },
  ],
};
