import { config } from "@repo/eslint-config/base";

export default [
  ...config,
  {
    ignores: ["dist/**", "eslint.config.mjs"],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
