import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { components } from "./_generated/api";
import { registerRoutes } from "@convex-dev/stripe";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);
registerRoutes(http, components.stripe, {
    webhookPath: "/stripe/webhook",
  });

export default http;
