import baseConfig, { restrictEnvAccess } from "@turbologs/eslint-config/base";
import nextjsConfig from "@turbologs/eslint-config/nextjs";
import reactConfig from "@turbologs/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
