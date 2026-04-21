"use client";

import type { ReactNode } from "react";

export function SubscriptionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

export default SubscriptionsProvider;

