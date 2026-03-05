import { betterAuth } from "better-auth/minimal";
import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { ConvexError } from "convex/values";
import authConfig from "./auth.config";
import { components } from "./_generated/api";
import { query } from "./_generated/server";
import type { GenericCtx } from "@convex-dev/better-auth";
import type { DataModel } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const siteUrl = process.env.SITE_URL!;

export const authComponent = createClient<DataModel>(components.betterAuth);
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    socialProviders: {
      google: {
        prompt: "select_account",
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
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

export const getAuthUserId = async (ctx: AuthUserIdCtx): Promise<string | null> => {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? null;
};

export const requireAuthUserId = async (ctx: AuthUserIdCtx): Promise<string> => {
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
