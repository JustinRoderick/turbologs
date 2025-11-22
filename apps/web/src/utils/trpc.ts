import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@turbologs/api/routers/index";

export const { TRPCProvider, useTRPC, useTRPCClient } =
	createTRPCContext<AppRouter>();
