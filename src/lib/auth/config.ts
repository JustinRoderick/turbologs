import { configSchema, server } from "better-env/config-schema";

export const authConfig = configSchema("Auth", {
  secret: server({ env: "BETTER_AUTH_SECRET" }),
});
