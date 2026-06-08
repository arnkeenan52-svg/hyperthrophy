"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { db } from "@/lib/db";
import type { Session, SetLog } from "@/lib/db/types";
import { estimate1RM } from "@/lib/engine/oneRepMax";
import { setVolume } from "@/lib/engine/stats";
import {
  addExerciseToSession,
  cancelSession,
  finishSession,
} from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatClock, formatNumber } from "@/lib/utils";
import { ExerciseLogCard } from "./ExerciseLogCard";
import { ExercisePicker } from "./ExercisePicker";
import { RestTimer } from "./RestTimer";
import { Celebration } from "./Celebration";

function useElapsed(startedAt: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

export function ActiveSession({ session }: { session: Session }) {
  const router = useRouter();
  const elapsed = useElapsed(session.startedAt);
  const [rest, setRest] = useState<{ sec: number; key: number } | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const exercises = useLiveQuery(
    () => db.sessionExercises.where("sessionId").equals(session.id!).sortBy("order"),
    [session.id],
  );
  const allSets = useLiveQuery(
    async () => {
      const ses = await db.sessionExercises.where("sessionId").equals(session.id!).toArray();
      const ids = ses.map((s) => s.id!);
      return db.setLogs.where("sessionExerciseId").anyOf(ids).toArray();
    },
    [session.id],
  );

  const list = exercises ?? [];
  const sets = allSets ?? [];
  const completedExercises = list.filter((se) =>
    sets.some((s) => s.sessionExerciseId === se.id && s.completed),
  ).length;
  const volume = sets.reduce((n, s) => n + (s.completed ? setVolume(s) : 0), 0);
  const progress = list.length ? (completedExercises / list.length) * 100 : 0;

  function triggerRest(sec: number) {
    setRest((r) => ({ sec, key: (r?.key ?? 0) + 1 }));
  }

  async function checkPR(set: SetLog, name: string) {
    if (!set.exerciseId || !set.weightKg || !set.reps) return;
    const e = estimate1RM(set.weightKg, set.reps);
    const prior = await db.setLogs
      .where("exerciseId")
      .equals(set.exerciseId)
      .filter((s) => s.id !== set.id && s.completed && !!s.weightKg && !!s.reps)
      .toArray();
    const ref = await db.oneRmRefs.where("exerciseId").equals(set.exerciseId).first();
    const bestPrior = Math.max(
      ref?.value ?? 0,
      ...prior.map((s) => estimate1RM(s.weightKg!, s.reps!)),
      0,
    );
    if (e > bestPrior && bestPrior > 0) {
      setCelebrate(true);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([40, 40, 80]);
      }
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
      celebrateTimer.current = setTimeout(() => setCelebrate(false), 1000);
      toast.success(`New PR — ${name}`, {
        description: `Estimated 1RM: ${Math.round(e)}kg`,
      });
    }
  }

  async function onFinish() {
    await finishSession(session.id!);
    toast.success("Session saved", { description: `${formatNumber(volume)}kg total volume` });
    router.push("/");
  }

  async function onQuit() {
    const hasData = sets.some((s) => s.completed);
    if (hasData) {
      await finishSession(session.id!);
      toast("Session saved");
    } else {
      await cancelSession(session.id!);
      toast("Session discarded");
    }
    router.push("/");
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <Celebration show={celebrate} />

      {/* Sticky session header */}
      <div className="sticky top-0 z-20 -mx-4 bg-background/80 px-4 pb-3 pt-1 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold">{session.name}</h1>
            <p className="font-mono text-xs tabular-nums text-muted-foreground">
              {formatClock(elapsed)} elapsed
            </p>
          </div>
          <button
            onClick={onQuit}
            className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground active:scale-95"
          >
            <X className="size-3.5" /> End
          </button>
        </div>
        <div className="mt-2.5 flex items-center gap-3">
          <Progress value={progress} className="h-1.5" />
          <span className="shrink-0 text-xs text-muted-foreground">
            {completedExercises}/{list.length}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="stat-num font-semibold text-ember">{formatNumber(volume)}</span> kg volume
        </p>
      </div>

      <div className="space-y-3">
        {list.map((se) => (
          <ExerciseLogCard
            key={se.id}
            se={se}
            date={session.date}
            onSetCompleted={triggerRest}
            onCheckPR={checkPR}
          />
        ))}
      </div>

      <ExercisePicker
        onPick={(ex) => addExerciseToSession(session.id!, ex)}
      />

      <Button onClick={onFinish} size="lg" className="w-full">
        <Check className="size-5" /> Finish session
      </Button>

      {rest && (
        <RestTimer
          seconds={rest.sec}
          runKey={rest.key}
          onDismiss={() => setRest(null)}
        />
      )}
    </div>
  );
}
