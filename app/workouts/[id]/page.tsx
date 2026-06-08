import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AddExercisePicker from "@/components/AddExercisePicker";
import EntryCard from "@/components/EntryCard";

export const dynamic = "force-dynamic";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workoutId = Number(id);
  if (!Number.isFinite(workoutId)) notFound();

  const [workout, exercises] = await Promise.all([
    prisma.workout.findUnique({
      where: { id: workoutId },
      include: {
        entries: {
          orderBy: { order: "asc" },
          include: {
            exercise: { select: { name: true, slug: true } },
            sets: { orderBy: { order: "asc" } },
          },
        },
      },
    }),
    prisma.exercise.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!workout) notFound();

  const totalVolume = workout.entries.reduce(
    (n, e) =>
      n + e.sets.reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/workouts"
          className="text-sm text-[var(--muted)] hover:text-[var(--text)]"
        >
          ← All workouts
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-3xl font-bold">{workout.name}</h1>
          <span className="text-sm text-[var(--muted)]">
            {new Date(workout.date).toLocaleDateString()}
          </span>
        </div>
        <div className="mt-2 flex gap-4 text-sm text-[var(--muted)]">
          <span>{workout.entries.length} exercises</span>
          {totalVolume > 0 && (
            <span className="text-brand-300">
              Total volume: {totalVolume.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <AddExercisePicker workoutId={workoutId} exercises={exercises} />

      {workout.entries.length === 0 ? (
        <div className="card p-10 text-center text-[var(--muted)]">
          No exercises yet. Add one above to start logging sets.
        </div>
      ) : (
        <div className="space-y-4">
          {workout.entries.map((entry) => (
            <EntryCard
              key={entry.id}
              workoutId={workoutId}
              entry={{
                id: entry.id,
                exerciseName: entry.exercise.name,
                exerciseSlug: entry.exercise.slug,
                sets: entry.sets.map((s) => ({
                  id: s.id,
                  weight: s.weight,
                  reps: s.reps,
                })),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
