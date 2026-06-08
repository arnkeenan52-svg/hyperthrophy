"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Flame } from "lucide-react";
import { db } from "@/lib/db";
import type { SetLog } from "@/lib/db/types";
import {
  useAllSetLogs,
  useBodyweight,
  useExercisesMap,
  useSessions,
} from "@/hooks/useDb";
import { classifyExercise, dayStreak, thisWeekVolume } from "@/lib/engine/stats";
import { Card } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/common/AnimatedNumber";
import {
  BodyweightChart,
  E1rmChart,
  VolumeChart,
} from "@/components/progress/Charts";
import {
  BodyweightLogger,
  CalendarHeatmap,
  PRList,
  PullFocusCard,
  SessionHistory,
} from "@/components/progress/Extras";
import { formatNumber } from "@/lib/utils";

export default function ProgressPage() {
  const sets = useAllSetLogs();
  const sessions = useSessions();
  const bodyweight = useBodyweight();
  const exercises = useExercisesMap();

  // Map sessionId -> its completed set logs (via sessionExercises).
  const setsBySession = useLiveQuery(async () => {
    const ses = await db.sessionExercises.toArray();
    const seToSession = new Map(ses.map((s) => [s.id!, s.sessionId]));
    const all = await db.setLogs.toArray();
    const m = new Map<number, SetLog[]>();
    for (const s of all) {
      const sid = seToSession.get(s.sessionExerciseId);
      if (sid == null) continue;
      if (!m.has(sid)) m.set(sid, []);
      if (s.completed) m.get(sid)!.push(s);
    }
    return m;
  });

  const completed = (sessions ?? []).filter((s) => s.status === "completed");
  const allSets = sets ?? [];
  const streak = dayStreak(completed.map((s) => s.date));
  const weekVol = thisWeekVolume(allSets);

  const groupOf = useMemo(() => {
    const map = exercises ?? new Map();
    return (id: string | null) => {
      const ex = id ? map.get(id) : null;
      return ex ? classifyExercise(ex) : ("other" as const);
    };
  }, [exercises]);

  if (!sets || !sessions || !exercises) {
    return <div className="h-40 animate-pulse rounded-2xl bg-surface" />;
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <header>
        <h1 className="font-display text-2xl font-bold">Progress</h1>
        <p className="text-sm text-muted-foreground">
          {formatNumber(allSets.length)} sets · {completed.length} sessions
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="mb-1 flex items-center gap-1.5">
            <Flame className="size-4 text-ember" />
            <span className="text-xs text-muted-foreground">Day streak</span>
          </div>
          <AnimatedNumber value={streak} className="stat-num text-3xl font-bold" />
        </Card>
        <Card className="p-4">
          <span className="text-xs text-muted-foreground">This week</span>
          <p className="stat-num text-3xl font-bold">
            <AnimatedNumber value={Math.round(weekVol)} />
            <span className="ml-1 text-sm font-normal text-muted-foreground">kg</span>
          </p>
        </Card>
      </div>

      <PullFocusCard sets={allSets} groupOf={groupOf} />
      <E1rmChart sets={allSets} exercises={exercises} />
      <VolumeChart sets={allSets} />

      <Card className="p-4">
        <h3 className="mb-3 font-display font-semibold">Log bodyweight</h3>
        <BodyweightLogger
          latest={bodyweight?.length ? bodyweight[bodyweight.length - 1].weightKg : null}
        />
      </Card>
      <BodyweightChart data={bodyweight ?? []} />

      <CalendarHeatmap sets={allSets} />
      <PRList sets={allSets} exercises={exercises} />

      <section>
        <h3 className="mb-2 font-display font-semibold">History</h3>
        <SessionHistory sessions={completed} setsBySession={setsBySession ?? new Map()} />
      </section>
    </div>
  );
}
