"use client";

import { useEffect, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import type { SetLog } from "@/lib/db/types";
import type { RirCue } from "@/lib/engine/rir";
import { cn } from "@/lib/utils";

interface Props {
  set: SetLog;
  index: number;
  cue: RirCue;
  onPersist: (patch: Partial<SetLog>) => void;
  onComplete: (set: SetLog) => void;
  onRemove: () => void;
}

export function SetRow({ set, index, cue, onPersist, onComplete, onRemove }: Props) {
  const [weight, setWeight] = useState(set.weightKg?.toString() ?? "");
  const [reps, setReps] = useState(set.reps?.toString() ?? "");

  useEffect(() => {
    setWeight(set.weightKg?.toString() ?? "");
    setReps(set.reps?.toString() ?? "");
  }, [set.weightKg, set.reps]);

  const completed = set.completed;

  function persist() {
    onPersist({
      weightKg: weight === "" ? null : Number(weight),
      reps: reps === "" ? null : Number(reps),
    });
  }

  function toggleComplete() {
    if (completed) {
      onPersist({ completed: false });
      return;
    }
    const w = weight === "" ? null : Number(weight);
    const r = reps === "" ? null : Number(reps);
    if (r == null) return; // need at least reps to complete
    onComplete({ ...set, weightKg: w, reps: r, completed: true });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-colors",
        completed
          ? cue.capped
            ? "border-current/40 bg-current/10"
            : "border-ember/40 bg-ember/10"
          : "border-border bg-surface-2/40",
      )}
    >
      <span className="w-6 text-center text-xs font-medium text-muted-foreground">
        {index + 1}
      </span>
      <input
        inputMode="decimal"
        type="number"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={persist}
        placeholder="kg"
        className="h-10 w-full min-w-0 rounded-lg bg-surface px-2 text-center font-mono text-lg font-semibold tabular-nums outline-none focus:ring-1 focus:ring-ember/50"
      />
      <span className="text-muted-foreground">×</span>
      <input
        inputMode="numeric"
        type="number"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={persist}
        placeholder="reps"
        className="h-10 w-full min-w-0 rounded-lg bg-surface px-2 text-center font-mono text-lg font-semibold tabular-nums outline-none focus:ring-1 focus:ring-ember/50"
      />
      <button
        onClick={toggleComplete}
        aria-label="Complete set"
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg transition-all active:scale-90",
          completed
            ? cue.capped
              ? "bg-current text-black"
              : "bg-ember text-black"
            : "bg-surface text-muted-foreground",
        )}
      >
        <Check className="size-5" />
      </button>
      <button
        onClick={onRemove}
        aria-label="Remove set"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 active:scale-90"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
