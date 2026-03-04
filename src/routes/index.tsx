import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/")({
  component: Home,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(convexQuery(api.auth.getCurrentUser, {})),
      // Load multiple queries in parallel if needed
    ]);
  },
});

function Home() {
  const { data: currentUser } = useSuspenseQuery(convexQuery(api.auth.getCurrentUser, {}));

  return (
    <main className="p-8 flex flex-col gap-16">
      <h1 className="text-4xl font-bold text-center">Convex + Tanstack Start</h1>
      <div className="flex flex-col gap-8 max-w-lg mx-auto">
        <p>Welcome {currentUser?.name ?? "Anonymous"}!</p>
        <p>
          Better Auth is connected to Convex. Your racing domain schema is now ready for garages,
          cars, runs, file metadata, and analytics.
        </p>
        <p>
          Edit{" "}
          <code className="text-sm font-bold font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded-md">
            convex/schema.ts
          </code>{" "}
          to change your backend
        </p>
        <p>
          Edit{" "}
          <code className="text-sm font-bold font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded-md">
            src/routes/index.tsx
          </code>{" "}
          to change your frontend
        </p>
        <p>
          Open{" "}
          <Link to="/anotherPage" className="text-blue-600 underline hover:no-underline">
            another page
          </Link>{" "}
          to send an action.
        </p>
        <div className="flex flex-col">
          <p className="text-lg font-bold">Useful resources:</p>
          <div className="flex gap-2">
            <div className="flex flex-col gap-2 w-1/2">
              <ResourceCard
                title="Convex docs"
                description="Read comprehensive documentation for all Convex features."
                href="https://docs.convex.dev/home"
              />
              <ResourceCard
                title="Stack articles"
                description="Learn about best practices, use cases, and more from a growing
            collection of articles, videos, and walkthroughs."
                href="https://www.typescriptlang.org/docs/handbook/2/basic-types.html"
              />
            </div>
            <div className="flex flex-col gap-2 w-1/2">
              <ResourceCard
                title="Templates"
                description="Browse our collection of templates to get started quickly."
                href="https://www.convex.dev/templates"
              />
              <ResourceCard
                title="Discord"
                description="Join our developer community to ask questions, trade tips & tricks,
            and show off your projects."
                href="https://www.convex.dev/community"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ResourceCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="flex flex-col gap-2 bg-slate-200 dark:bg-slate-800 p-4 rounded-md h-28 overflow-auto">
      <a href={href} className="text-sm underline hover:no-underline">
        {title}
      </a>
      <p className="text-xs">{description}</p>
    </div>
  );
}
