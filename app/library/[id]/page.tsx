"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function toEmbed(url: string | null): string | null {
  if (!url) return null;
  const w = url.match(/[?&]v=([^&]+)/);
  if (w) return `https://www.youtube.com/embed/${w[1]}`;
  const s = url.match(/youtu\.be\/([^?]+)/);
  if (s) return `https://www.youtube.com/embed/${s[1]}`;
  return null;
}

export default function ExerciseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const e = useLiveQuery(() => db.exercises.get(id), [id]);

  if (e === undefined) return <div className="h-40 animate-pulse rounded-2xl bg-surface" />;
  if (e === null)
    return (
      <div className="animate-fade-up">
        <Link href="/library" className="text-sm text-muted-foreground">← Library</Link>
        <p className="mt-4">Exercise not found.</p>
      </div>
    );

  const embed = toEmbed(e.video);

  return (
    <div className="space-y-5 animate-fade-up">
      <Link href="/library" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Library
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold">{e.name}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge variant="ember" className="capitalize">{e.category}</Badge>
          {e.equipment.filter((x) => x !== "none").map((x) => (
            <Badge key={x} className="capitalize">{x}</Badge>
          ))}
        </div>
      </div>

      <Card className="p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Primary muscles
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {e.primaryMuscles.length ? (
            e.primaryMuscles.map((m) => (
              <Badge key={m} variant="current" className="capitalize">{m}</Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
        {e.secondaryMuscles.length > 0 && (
          <>
            <h3 className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Secondary
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {e.secondaryMuscles.map((m) => (
                <Badge key={m} className="capitalize">{m}</Badge>
              ))}
            </div>
          </>
        )}
      </Card>

      {embed && (
        <div className="aspect-video overflow-hidden rounded-2xl border border-border">
          <iframe
            src={embed}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {e.instructions.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 font-display font-semibold">Instructions</h3>
          <ol className="space-y-2.5">
            {e.instructions.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ember/15 text-xs font-semibold text-ember-300">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {e.tips.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-2 font-display font-semibold">Tips</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {e.tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
