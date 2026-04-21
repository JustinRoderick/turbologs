import { betterAuth } from "better-auth/minimal";
import { createClient } from "@convex-dev/better-auth";
import { ConvexError } from "convex/values";
import { convex } from "@convex-dev/better-auth/plugins";
import { env } from "./env";
import authConfig from "./auth.config";
import { components } from "./_generated/api";
import { query } from "./_generated/server";
import type { GenericCtx } from "@convex-dev/better-auth";
import type { DataModel } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export const authComponent = createClient<DataModel>(components.betterAuth);
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: env.SITE_URL,
    socialProviders: {
      google: {
        prompt: "select_account",
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [convex({ authConfig })],
  });
};

type AuthUserIdCtx = Pick<QueryCtx, "auth"> | Pick<MutationCtx, "auth">;

export const getAuthUserId = async (
  ctx: AuthUserIdCtx,
): Promise<string | null> => {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? null;
};

export const requireAuthUserId = async (
  ctx: AuthUserIdCtx,
): Promise<string> => {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) {
    throw new ConvexError("Unauthorized");
  }
  return authUserId;
};

// delete later
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.getAuthUser(ctx);
  },
});
