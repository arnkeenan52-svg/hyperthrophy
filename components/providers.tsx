"use client";

import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { seedIfNeeded } from "@/lib/db";

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    seedIfNeeded()
      .catch((e) => console.error("seed failed", e))
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-ember border-t-transparent" />
        <p className="font-display text-sm text-muted-foreground">
          Loading your program…
        </p>
      </div>
    );
  }

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
