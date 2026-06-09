"use client";

import Link from "next/link";
import { ArrowRight, Dumbbell, Flame, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/common/AnimatedNumber";
import {
  useActiveSession,
  useAllSetLogs,
  useBodyweight,
  usePlans,
  useSessions,
  nextPlan,
} from "@/hooks/useDb";
import { dayStreak, thisWeekVolume } from "@/lib/engine/stats";
import { formatNumber } from "@/lib/utils";

const dayLabel: Record<string, string> = {
  UPPER_HEAVY: "Upper · Heavy",
  LOWER_HEAVY: "Lower · Heavy",
  PUSH_VOLUME: "Push · Volume",
  PULL_VOLUME: "Pull · Volume",
  LEGS_VOLUME: "Legs · Volume",
};

export default function HomePage() {
  const plans = usePlans();
  const sessions = useSessions();
  const setLogs = useAllSetLogs();
  const bodyweight = useBodyweight();
  const active = useActiveSession();

  const completed = (sessions ?? []).filter((s) => s.status === "completed");
  const today = nextPlan(plans ?? [], completed[0]?.planId ?? null);
  const streak = dayStreak(completed.map((s) => s.date));
  const weekVol = thisWeekVolume(setLogs ?? []);
  const bw = bodyweight?.length ? bodyweight[bodyweight.length - 1].weightKg : null;

  return (
    <div className="space-y-6 animate-fade-up">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Let&apos;s <span className="text-gradient-ember">build.</span>
          </h1>
        </div>
        <Badge variant="current">Pull focus</Badge>
      </header>

      {/* Today's session hero */}
      <Card className="relative overflow-hidden border-white/10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-ember/25 opacity-40 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
        <div className="relative p-6">
          <div className="flex items-center gap-2">
            {active && <span className="size-2 animate-pulse rounded-full bg-ember" />}
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-ember/80">
              {active ? "Session in progress" : "Today's session"}
            </p>
          </div>
          <h2 className="mt-2 font-display text-4xl font-bold tracking-tight">
            {active ? active.name : today ? dayLabel[today.dayType] : "Rest day"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {active
              ? "Pick up where you left off"
              : today
                ? `${today.name} day · tap to start logging`
                : "No plan scheduled — enjoy the recovery"}
          </p>
          <Button asChild size="lg" className="mt-5 w-full glow-ember">
            <Link href="/session">
              <Dumbbell className="size-5" />
              {active ? "Resume session" : "Start session"}
              <ArrowRight className="size-5" />
            </Link>
          </Button>
        </div>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          icon={<Flame className="size-4 text-ember" />}
          label="Day streak"
          value={<AnimatedNumber value={streak} className="stat-num text-2xl font-bold" />}
        />
        <StatTile
          icon={<TrendingUp className="size-4 text-current" />}
          label="Week volume"
          value={
            <span className="stat-num text-2xl font-bold">
              <AnimatedNumber value={Math.round(weekVol)} />
            </span>
          }
          sub="kg"
        />
        <StatTile
          icon={<Dumbbell className="size-4 text-muted-foreground" />}
          label="Bodyweight"
          value={
            <span className="stat-num text-2xl font-bold">
              {bw != null ? <AnimatedNumber value={bw} decimals={1} /> : "—"}
            </span>
          }
          sub="kg"
        />
      </div>

      {/* This week's plans */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display font-semibold">Your split</h3>
          <Link href="/plans" className="text-xs text-muted-foreground hover:text-foreground">
            Edit plans
          </Link>
        </div>
        <div className="space-y-2">
          {(plans ?? []).map((p) => {
            const isToday = today?.id === p.id;
            const done = completed.filter((s) => s.planId === p.id).length;
            return (
              <Link key={p.id} href={`/session?plan=${p.id}`}>
                <Card
                  className={`flex items-center justify-between p-3.5 transition-colors ${isToday ? "border-ember/50 bg-ember/5" : "hover:border-border"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex size-9 items-center justify-center rounded-xl text-sm font-bold ${isToday ? "bg-ember text-black" : "bg-surface-2 text-muted-foreground"}`}>
                      {p.order}
                    </div>
                    <div>
                      <p className="font-medium leading-tight">{dayLabel[p.dayType]}</p>
                      <p className="text-xs text-muted-foreground">
                        {done > 0 ? `${done} logged` : "Not logged yet"}
                      </p>
                    </div>
                  </div>
                  {isToday && <Badge variant="ember">Today</Badge>}
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <p className="pt-2 text-center text-xs text-muted-foreground">
        {formatNumber((setLogs ?? []).length)} sets logged all-time
      </p>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <Card className="p-3.5">
      <div className="mb-2 flex items-center gap-1.5">{icon}</div>
      <div className="flex items-baseline gap-1">
        {value}
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </Card>
  );
}
