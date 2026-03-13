"use client";

import * as React from "react";

type PostHogProviderClientProps = {
  children: React.ReactNode;
  apiKey: string;
  options: Record<string, unknown>;
};

export function PostHogProviderClient({
  children,
  apiKey,
  options,
}: PostHogProviderClientProps) {
  const [Provider, setProvider] = React.useState<
    React.ComponentType<{
      children: React.ReactNode;
      apiKey: string;
      options: Record<string, unknown>;
    }> | null
  >(null);

  React.useEffect(() => {
    import("posthog-js/react").then((mod) => {
      setProvider(() => mod.PostHogProvider);
    });
  }, []);

  if (!Provider) {
    return <>{children}</>;
  }

  return (
    <Provider apiKey={apiKey} options={options}>
      {children}
    </Provider>
  );
}
