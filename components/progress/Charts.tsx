"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Exercise, SetLog } from "@/lib/db/types";
import { classifyExercise, e1rmSeries, weeklyVolume } from "@/lib/engine/stats";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

const EMBER = "#ff7a1a";
const CURRENT = "#2dd4bf";

function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs shadow-xl">
      <p className="text-muted-foreground">{label}</p>
      <p className="stat-num font-semibold">
        {formatNumber(payload[0].value)} {unit}
      </p>
    </div>
  );
}

export function VolumeChart({ sets }: { sets: SetLog[] }) {
  const data = useMemo(() => weeklyVolume(sets, 8), [sets]);
  const hasData = data.some((d) => d.volume > 0);
  return (
    <Card className="p-4">
      <h3 className="mb-1 font-display font-semibold">Weekly volume</h3>
      <p className="mb-3 text-xs text-muted-foreground">Last 8 weeks · kg lifted</p>
      <div className="h-40">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#ffffff10" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8a8178" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#8a8178" }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
              <Tooltip content={<ChartTooltip unit="kg" />} cursor={{ fill: "#ffffff08" }} />
              <Bar dataKey="volume" fill={EMBER} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty />
        )}
      </div>
    </Card>
  );
}

export function E1rmChart({
  sets,
  exercises,
}: {
  sets: SetLog[];
  exercises: Map<string, Exercise>;
}) {
  // exercises that have logged data
  const options = useMemo(() => {
    const ids = new Set(sets.filter((s) => s.exerciseId && s.completed).map((s) => s.exerciseId!));
    return [...ids]
      .map((id) => exercises.get(id))
      .filter(Boolean)
      .map((e) => ({ id: e!.id, name: e!.name, group: classifyExercise(e!) }))
      .sort((a, b) => (a.group === "pull" ? -1 : 1) - (b.group === "pull" ? -1 : 1));
  }, [sets, exercises]);

  const [selected, setSelected] = useState<string | null>(null);
  const activeId = selected ?? options[0]?.id ?? null;
  const activeOpt = options.find((o) => o.id === activeId);
  const isPull = activeOpt?.group === "pull";

  const data = useMemo(() => {
    if (!activeId) return [];
    return e1rmSeries(sets.filter((s) => s.exerciseId === activeId)).map((p) => ({
      ...p,
      label: p.date.slice(5),
    }));
  }, [sets, activeId]);

  return (
    <Card className="p-4">
      <h3 className="mb-1 font-display font-semibold">Estimated 1RM</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Brzycki estimate · <span className="text-current-400">pull lifts highlighted</span>
      </p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {options.slice(0, 10).map((o) => (
          <button
            key={o.id}
            onClick={() => setSelected(o.id)}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
              o.id === activeId
                ? o.group === "pull"
                  ? "border-current bg-current/15 text-current-400"
                  : "border-ember bg-ember/15 text-ember-300"
                : "border-border text-muted-foreground"
            }`}
          >
            {o.name.length > 18 ? o.name.slice(0, 18) + "…" : o.name}
          </button>
        ))}
      </div>
      <div className="h-44">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#ffffff10" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8a8178" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#8a8178" }} axisLine={false} tickLine={false} width={44} domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip content={<ChartTooltip unit="kg" />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={isPull ? CURRENT : EMBER}
                strokeWidth={2.5}
                dot={{ r: 3, fill: isPull ? CURRENT : EMBER }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty label="Log a few sets to see strength trends" />
        )}
      </div>
    </Card>
  );
}

export function BodyweightChart({
  data,
}: {
  data: { date: string; weightKg: number }[];
}) {
  const chart = data.map((d) => ({ label: d.date.slice(5), value: d.weightKg }));
  const delta =
    data.length > 1 ? data[data.length - 1].weightKg - data[0].weightKg : 0;
  return (
    <Card className="p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="font-display font-semibold">Bodyweight</h3>
        {data.length > 0 && (
          <span className="stat-num text-sm text-muted-foreground">
            {data[data.length - 1].weightKg.toFixed(1)}kg{" "}
            <span className={delta >= 0 ? "text-current-400" : "text-ember-300"}>
              {delta >= 0 ? "+" : ""}
              {delta.toFixed(1)}
            </span>
          </span>
        )}
      </div>
      <div className="h-32">
        {chart.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="bw" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CURRENT} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={CURRENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8a8178" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#8a8178" }} axisLine={false} tickLine={false} width={44} domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip content={<ChartTooltip unit="kg" />} />
              <Area type="monotone" dataKey="value" stroke={CURRENT} strokeWidth={2.5} fill="url(#bw)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Empty label="Add weigh-ins to see your trend" />
        )}
      </div>
    </Card>
  );
}

function Empty({ label = "No data yet" }: { label?: string }) {
  return (
    <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">
      {label}
    </div>
  );
}
