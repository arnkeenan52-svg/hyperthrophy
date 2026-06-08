import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MUSCLE_GROUPS, parseExercise } from "@/lib/exercises";
import ExerciseFilters from "@/components/ExerciseFilters";
import ExerciseCard from "@/components/ExerciseCard";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type SearchParams = {
  q?: string;
  group?: string;
  category?: string;
  equipment?: string;
  page?: string;
};

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const all = (await prisma.exercise.findMany({ orderBy: { name: "asc" } })).map(
    parseExercise,
  );

  // Build filter option lists from the data.
  const categories = [...new Set(all.map((e) => e.category))].sort();
  const equipment = [
    ...new Set(all.flatMap((e) => e.equipment).filter((e) => e && e !== "none")),
  ].sort();
  const groups = Object.keys(MUSCLE_GROUPS);

  const q = (sp.q ?? "").toLowerCase().trim();
  const groupMuscles = sp.group ? MUSCLE_GROUPS[sp.group] ?? [] : null;

  const filtered = all.filter((e) => {
    if (q && !e.name.toLowerCase().includes(q)) return false;
    if (sp.category && e.category !== sp.category) return false;
    if (sp.equipment && !e.equipment.includes(sp.equipment)) return false;
    if (groupMuscles) {
      const muscles = [...e.primaryMuscles, ...e.secondaryMuscles];
      if (!muscles.some((m) => groupMuscles.includes(m))) return false;
    }
    return true;
  });

  const page = Math.max(1, Number(sp.page) || 1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const qs = (p: number) => {
    const next = new URLSearchParams();
    if (sp.q) next.set("q", sp.q);
    if (sp.group) next.set("group", sp.group);
    if (sp.category) next.set("category", sp.category);
    if (sp.equipment) next.set("equipment", sp.equipment);
    next.set("page", String(p));
    return `/exercises?${next.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exercises</h1>
        <p className="text-sm text-[var(--muted)]">
          {filtered.length} {filtered.length === 1 ? "result" : "results"}
        </p>
      </div>

      <ExerciseFilters groups={groups} categories={categories} equipment={equipment} />

      {slice.length === 0 ? (
        <div className="card p-10 text-center text-[var(--muted)]">
          No exercises match those filters.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slice.map((e) => (
            <ExerciseCard key={e.id} exercise={e} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          {current > 1 ? (
            <Link href={qs(current - 1)} className="btn-ghost">
              ← Prev
            </Link>
          ) : (
            <span className="btn-ghost opacity-40">← Prev</span>
          )}
          <span className="text-sm text-[var(--muted)]">
            Page {current} of {totalPages}
          </span>
          {current < totalPages ? (
            <Link href={qs(current + 1)} className="btn-ghost">
              Next →
            </Link>
          ) : (
            <span className="btn-ghost opacity-40">Next →</span>
          )}
        </div>
      )}
    </div>
  );
}
