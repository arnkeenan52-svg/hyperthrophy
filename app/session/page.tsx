"use client";

import { Suspense } from "react";
import { useActiveSession } from "@/hooks/useDb";
import { ActiveSession } from "@/components/session/ActiveSession";
import { SessionStart } from "@/components/session/SessionStart";

function SessionInner() {
  const active = useActiveSession();
  if (active === undefined) {
    return <div className="h-40 animate-pulse rounded-2xl bg-surface" />;
  }
  if (active) return <ActiveSession session={active} />;
  return <SessionStart />;
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-surface" />}>
      <SessionInner />
    </Suspense>
  );
}
