"use client";

import { useMemo, useState, useTransition } from "react";
import { addExercise } from "@/lib/actions";

type Option = { id: number; name: string };

export default function AddExercisePicker({
  workoutId,
  exercises,
}: {
  workoutId: number;
  exercises: Option[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const matches = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return exercises
      .filter((e) => e.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, exercises]);

  function pick(id: number) {
    setQuery("");
    setOpen(false);
    startTransition(() => addExercise(workoutId, id));
  }

  return (
    <div className="card relative p-4">
      <label className="mb-2 block text-sm font-medium">Add an exercise</label>
      <input
        className="input"
        placeholder="Search exercises to add…"
        value={query}
        disabled={pending}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && matches.length > 0 && (
        <ul className="absolute left-4 right-4 z-10 mt-1 max-h-72 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface-2)] shadow-xl">
          {matches.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => pick(m.id)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-brand-600/20"
              >
                {m.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {pending && (
        <p className="mt-2 text-xs text-[var(--muted)]">Adding…</p>
      )}
    </div>
  );
}
