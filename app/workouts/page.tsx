import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createWorkout } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function WorkoutsPage() {
  const workouts = await prisma.workout.findMany({
    orderBy: { date: "desc" },
    include: {
      entries: { include: { sets: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Workouts</h1>
        <p className="text-sm text-[var(--muted)]">
          Log your training sessions and track progressive overload.
        </p>
      </div>

      <form action={createWorkout} className="card flex flex-col gap-3 p-4 sm:flex-row">
        <input
          name="name"
          className="input"
          placeholder="New workout name (e.g. Push Day A)"
        />
        <button type="submit" className="btn-primary shrink-0">
          + New workout
        </button>
      </form>

      {workouts.length === 0 ? (
        <div className="card p-10 text-center text-[var(--muted)]">
          No workouts yet. Create one above to get started.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {workouts.map((w) => {
            const sets = w.entries.reduce((n, e) => n + e.sets.length, 0);
            const volume = w.entries.reduce(
              (n, e) =>
                n +
                e.sets.reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0),
              0,
            );
            return (
              <Link
                key={w.id}
                href={`/workouts/${w.id}`}
                className="card p-4 transition-colors hover:border-brand-500"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{w.name}</h3>
                  <span className="chip">
                    {new Date(w.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-3 flex gap-4 text-sm text-[var(--muted)]">
                  <span>{w.entries.length} exercises</span>
                  <span>{sets} sets</span>
                  {volume > 0 && (
                    <span className="text-brand-300">
                      {volume.toLocaleString()} vol
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
