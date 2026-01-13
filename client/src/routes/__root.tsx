import type { ReactNode } from "react";
import { useEffect } from "react";
import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { AppRoot } from "@telegram-apps/telegram-ui";

import "@telegram-apps/telegram-ui/dist/styles.css";
import "../index.css";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
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
  }),
  component: RootComponent,
});

function RootComponent() {
  useEffect(() => {
    import("@twa-dev/sdk").then((app) => {
      app.default.ready();
    });
  }, []);

  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <AppRoot className="h-full w-full" suppressHydrationWarning>
          {children}
        </AppRoot>
        <Scripts />
      </body>
    </html>
  );
}
