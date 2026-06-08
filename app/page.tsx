import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MUSCLE_GROUPS } from "@/lib/exercises";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [exerciseCount, workoutCount, categories] = await Promise.all([
    prisma.exercise.count(),
    prisma.workout.count(),
    prisma.exercise.groupBy({
      by: ["category"],
      _count: { _all: true },
      orderBy: { _count: { category: "desc" } },
    }),
  ]);

  return (
    <div className="space-y-10">
      <section className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-700/30 to-transparent px-8 py-12">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Train for <span className="text-brand-500">growth.</span>
          </h1>
          <p className="mt-3 max-w-xl text-[var(--muted)]">
            A focused hypertrophy companion: explore a database of{" "}
            <strong className="text-[var(--text)]">{exerciseCount}</strong> exercises,
            then log your sets and reps to drive progressive overload.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/exercises" className="btn-primary">
              Browse exercises
            </Link>
            <Link href="/workouts" className="btn-ghost">
              Start a workout
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Exercises" value={exerciseCount} />
        <Stat label="Workouts logged" value={workoutCount} />
        <Stat label="Muscle groups" value={Object.keys(MUSCLE_GROUPS).length} />
        <Stat label="Categories" value={categories.length} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Browse by muscle group</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Object.keys(MUSCLE_GROUPS).map((group) => (
            <Link
              key={group}
              href={`/exercises?group=${encodeURIComponent(group)}`}
              className="card px-4 py-5 capitalize transition-colors hover:border-brand-500"
            >
              <span className="font-medium">{group}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card px-4 py-5">
      <div className="text-2xl font-bold text-brand-400">{value}</div>
      <div className="text-xs text-[var(--muted)]">{label}</div>
    </div>
  );
}
