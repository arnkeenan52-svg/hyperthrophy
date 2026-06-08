"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronRight, Info, Plus, ShieldAlert, TrendingUp } from "lucide-react";
import { db } from "@/lib/db";
import type { SessionExercise, SetLog } from "@/lib/db/types";
import { rirForSet } from "@/lib/engine/rir";
import { setVolume } from "@/lib/engine/stats";
import { addSet } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { cn, formatNumber } from "@/lib/utils";
import { SetRow } from "./SetRow";

interface Props {
  se: SessionExercise;
  date: string;
  onSetCompleted: (restSec: number) => void;
  onCheckPR: (set: SetLog, name: string) => void;
}

export function ExerciseLogCard({ se, date, onSetCompleted, onCheckPR }: Props) {
  const sets = useLiveQuery(
    () => db.setLogs.where("sessionExerciseId").equals(se.id!).sortBy("setIndex"),
    [se.id],
  );

  // Seed the prescribed number of empty sets the first time this card renders.
  useEffect(() => {
    if (sets === undefined) return;
    if (sets.length > 0) return;
    (async () => {
      const existing = await db.setLogs.where("sessionExerciseId").equals(se.id!).count();
      if (existing > 0) return;
      for (let i = 0; i < se.targetSets; i++) {
        const cue = rirForSet(se.failureRule, i, se.targetSets);
        await db.setLogs.add({
          sessionExerciseId: se.id!,
          exerciseId: se.exerciseId,
          setIndex: i,
          weightKg: se.suggestedWeightKg,
          reps: null,
          rirTarget: cue.target,
          rirActual: null,
          isWarmup: false,
          toFailure: false,
          completed: false,
          date,
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sets, se.id]);

  const list = sets ?? [];
  const total = list.length;
  const doneCount = list.filter((s) => s.completed).length;
  const volume = list.reduce((n, s) => n + (s.completed ? setVolume(s) : 0), 0);
  const isBig = se.failureRule === "cap1RIR";

  async function persist(id: number, patch: Partial<SetLog>) {
    await db.setLogs.update(id, patch);
  }

  async function complete(set: SetLog) {
    const idx = list.findIndex((s) => s.id === set.id);
    const cue = rirForSet(se.failureRule, idx, total);
    await db.setLogs.update(set.id!, {
      weightKg: set.weightKg,
      reps: set.reps,
      completed: true,
      rirTarget: cue.target,
      toFailure: cue.toFailureAllowed && idx === total - 1,
    });
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(35);
    }
    onSetCompleted(se.restSec);
    onCheckPR({ ...set, exerciseId: se.exerciseId }, se.name);
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-display font-semibold">{se.name}</h3>
              {isBig && (
                <span title="Big compound — capped at 1 RIR">
                  <ShieldAlert className="size-4 shrink-0 text-current" />
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {se.targetSets}×{se.repMin === se.repMax ? se.repMax : `${se.repMin}–${se.repMax}`} · rest {se.restSec}s
            </p>
          </div>
          {se.exerciseId && (
            <Link
              href={`/library/${se.exerciseId}`}
              className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
            >
              info <ChevronRight className="size-3" />
            </Link>
          )}
        </div>

        {/* Intensity + overload hints */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {isBig ? (
            <Badge variant="current">
              <ShieldAlert className="size-3" /> Never to failure · cap 1 RIR
            </Badge>
          ) : (
            <Badge variant="default">Last set: 0 RIR ok</Badge>
          )}
          {se.suggestionNote && (
            <Badge variant={se.suggestionNote.startsWith("+") ? "ember" : "default"}>
              {se.suggestionNote.startsWith("+") && <TrendingUp className="size-3" />}
              {se.suggestionNote}
            </Badge>
          )}
        </div>

        {se.note && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3 shrink-0" />
            {se.note}
          </p>
        )}
      </div>

      <div className="space-y-1.5 px-4 pb-3">
        {list.map((set, i) => (
          <SetRow
            key={set.id}
            set={set}
            index={i}
            cue={rirForSet(se.failureRule, i, total)}
            onPersist={(patch) => persist(set.id!, patch)}
            onComplete={complete}
            onRemove={() => db.setLogs.delete(set.id!)}
          />
        ))}

        {/* per-set RIR cue line for the active (next incomplete) set */}
        {doneCount < total && (
          <p className={cn("px-1 pt-1 text-xs", isBig ? "text-current-400" : "text-muted-foreground")}>
            {rirForSet(se.failureRule, doneCount, total).cue}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <button
          onClick={async () => {
            await addSet(
              {
                id: se.id!,
                exerciseId: se.exerciseId,
                suggestedWeightKg: list[list.length - 1]?.weightKg ?? se.suggestedWeightKg,
                rirTarget: rirForSet(se.failureRule, total, total + 1).target,
              },
              date,
            );
          }}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-ember"
        >
          <Plus className="size-4" /> Add set
        </button>
        <span className="text-xs text-muted-foreground">
          {doneCount}/{total} · {formatNumber(volume)} kg
        </span>
      </div>
    </div>
  );
}
