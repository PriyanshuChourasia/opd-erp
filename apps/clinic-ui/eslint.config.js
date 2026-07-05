import { config } from "@repo/eslint-config/react-internal";

export default [
  ...config,
  {
    ignores: ["dist/**", "src/routeTree.gen.ts"],
  },
  {
    rules: {
      // TypeScript prop types make react/prop-types redundant.
      "react/prop-types": "off",
      // Vite's import.meta.env vars aren't process.env, so turbo can't track them.
      "turbo/no-undeclared-env-vars": "off",
    },
  },
];
