import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseExercise, toEmbedUrl } from "@/lib/exercises";

export const dynamic = "force-dynamic";

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await prisma.exercise.findUnique({ where: { slug } });
  if (!row) notFound();

  const e = parseExercise(row);
  const embed = toEmbedUrl(e.video);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/exercises" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">
          ← All exercises
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{e.name}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="chip capitalize text-brand-300">{e.category}</span>
          {e.equipment
            .filter((x) => x !== "none")
            .map((x) => (
              <span key={x} className="chip capitalize">
                {x}
              </span>
            ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {e.description && (
            <section>
              <h2 className="mb-2 text-lg font-semibold">Overview</h2>
              <p className="text-[var(--muted)]">{e.description}</p>
            </section>
          )}

          {e.instructions.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-semibold">Instructions</h2>
              <ol className="space-y-2">
                {e.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600/20 text-xs font-semibold text-brand-300">
                      {i + 1}
                    </span>
                    <span className="text-[var(--muted)]">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {e.tips.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-semibold">Tips</h2>
              <ul className="list-disc space-y-1 pl-5 text-[var(--muted)]">
                {e.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </section>
          )}

          {embed && (
            <section>
              <h2 className="mb-2 text-lg font-semibold">Demonstration</h2>
              <div className="aspect-video overflow-hidden rounded-xl border border-[var(--border)]">
                <iframe
                  src={embed}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
              Primary muscles
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {e.primaryMuscles.length ? (
                e.primaryMuscles.map((m) => (
                  <span key={m} className="chip capitalize text-brand-300">
                    {m}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[var(--muted)]">—</span>
              )}
            </div>
          </div>
          {e.secondaryMuscles.length > 0 && (
            <div className="card p-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                Secondary muscles
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {e.secondaryMuscles.map((m) => (
                  <span key={m} className="chip capitalize">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
