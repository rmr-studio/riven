"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const QueryProvider = dynamic(
  () => import("@/providers/query-provider").then((m) => m.QueryProvider),
  { ssr: false },
);

export function LazyQueryProvider({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
