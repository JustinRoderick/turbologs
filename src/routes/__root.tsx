import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
} from "@tanstack/react-router";
import * as React from "react";
import { createServerFn } from "@tanstack/react-start";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { QueryClient } from "@tanstack/react-query";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import appCss from "@/styles/app.css?url";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/ThemeToggle";
import { authClient } from "@/lib/auth-client";
import { getToken } from "@/lib/auth-server";
import { PostHogProviderClient } from "@/components/PostHogProviderClient";

const getAuth = createServerFn({ method: "GET" }).handler(async () => {
  return await getToken();
});

const posthogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
} as const

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  beforeLoad: async (ctx) => {
    const token = await getAuth();
    // all queries, mutations and actions through TanStack Query will be
    // authenticated during SSR if we have a valid token
    if (token) {
      // During SSR only (the only time serverHttpClient exists),
      // set the auth token to make HTTP queries with.
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }
    return {
      isAuthenticated: !!token,
      token,
    };
  },
  notFoundComponent: () => <div>Route not found</div>,
  component: RootComponent,
});

function RootComponent() {
  const context = useRouteContext({ from: Route.id });
  return (
    <PostHogProviderClient
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY ?? ""}
      options={posthogOptions}
    >
      <ConvexBetterAuthProvider
        client={context.convexQueryClient.convexClient}
        authClient={authClient}
        initialToken={context.token}
      >
        <RootDocument>
          <Outlet />
        </RootDocument>
      </ConvexBetterAuthProvider>
    </PostHogProviderClient>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html className="bg-gray-950 dark:bg-gray-950">
      <head>
        <HeadContent />
      </head>
      <body className="bg-gray-950 dark:bg-gray-950">
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Scripts />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
