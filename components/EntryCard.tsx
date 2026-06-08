"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addSet, removeEntry, removeSet } from "@/lib/actions";

type SetRow = { id: number; weight: number | null; reps: number | null };
type Entry = {
  id: number;
  exerciseName: string;
  exerciseSlug: string;
  sets: SetRow[];
};

export default function EntryCard({
  workoutId,
  entry,
}: {
  workoutId: number;
  entry: Entry;
}) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [pending, startTransition] = useTransition();

  function logSet() {
    const w = weight === "" ? null : Number(weight);
    const r = reps === "" ? null : Number(reps);
    if (w === null && r === null) return;
    startTransition(async () => {
      await addSet(entry.id, workoutId, w, r);
      setWeight("");
      setReps("");
    });
  }

  const volume = entry.sets.reduce(
    (n, s) => n + (s.weight ?? 0) * (s.reps ?? 0),
    0,
  );

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/exercises/${entry.exerciseSlug}`}
          className="font-semibold hover:text-brand-400"
        >
          {entry.exerciseName}
        </Link>
        <button
          type="button"
          onClick={() =>
            startTransition(() => removeEntry(entry.id, workoutId))
          }
          className="text-xs text-[var(--muted)] hover:text-red-400"
        >
          Remove
        </button>
      </div>

      {entry.sets.length > 0 && (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-[var(--muted)]">
              <th className="w-10 py-1 font-medium">Set</th>
              <th className="py-1 font-medium">Weight</th>
              <th className="py-1 font-medium">Reps</th>
              <th className="py-1 font-medium">Volume</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {entry.sets.map((s, i) => (
              <tr key={s.id} className="border-t border-[var(--border)]">
                <td className="py-1.5 text-[var(--muted)]">{i + 1}</td>
                <td className="py-1.5">{s.weight ?? "—"}</td>
                <td className="py-1.5">{s.reps ?? "—"}</td>
                <td className="py-1.5 text-brand-300">
                  {(s.weight ?? 0) * (s.reps ?? 0) || "—"}
                </td>
                <td className="py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(() => removeSet(s.id, workoutId))
                    }
                    className="text-[var(--muted)] hover:text-red-400"
                    aria-label="Remove set"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          className="input w-24"
          type="number"
          inputMode="decimal"
          placeholder="kg"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <span className="text-[var(--muted)]">×</span>
        <input
          className="input w-24"
          type="number"
          inputMode="numeric"
          placeholder="reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
        />
        <button
          type="button"
          onClick={logSet}
          disabled={pending}
          className="btn-primary"
        >
          Add set
        </button>
        {volume > 0 && (
          <span className="ml-auto text-sm text-[var(--muted)]">
            Volume: <span className="text-brand-300">{volume.toLocaleString()}</span>
          </span>
        )}
      </div>
    </div>
  );
}
