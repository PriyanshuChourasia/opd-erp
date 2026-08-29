import { config } from "@repo/eslint-config/react-internal";

export default [
  ...config,
  {
    ignores: ["dist/**", "src/routeTree.gen.ts"],
  },
  {
    rules: {
      "react/prop-types": "off",
      "turbo/no-undeclared-env-vars": "off",
    },
  },
];
