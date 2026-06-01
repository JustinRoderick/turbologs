import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { components } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { resend } from "./emails";
import { registerRoutes } from "@convex-dev/stripe";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);
registerRoutes(http, components.stripe, {
  webhookPath: "/stripe/webhook",
});
http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    return await resend.handleResendEventWebhook(ctx, req);
  }),
});

export default http;
