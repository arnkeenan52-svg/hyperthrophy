"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center animate-fade-up">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
        <AlertTriangle className="size-7" />
      </div>
      <div>
        <h1 className="font-display text-xl font-bold">Something went wrong</h1>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
          {error?.message || "An unexpected error occurred."}
        </p>
      </div>
      <Button onClick={reset}>
        <RotateCcw className="size-4" /> Try again
      </Button>
    </div>
  );
}
