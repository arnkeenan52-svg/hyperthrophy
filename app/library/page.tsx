"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function LibraryPage() {
  const exercises = useLiveQuery(() => db.exercises.toArray());
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equip, setEquip] = useState("");

  const { muscles, equipment } = useMemo(() => {
    const ms = new Set<string>();
    const eq = new Set<string>();
    for (const e of exercises ?? []) {
      e.primaryMuscles.forEach((m) => ms.add(m));
      e.equipment.forEach((x) => x !== "none" && eq.add(x));
    }
    return {
      muscles: [...ms].sort(),
      equipment: [...eq].sort(),
    };
  }, [exercises]);

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    return (exercises ?? [])
      .filter((e) => {
        if (query && !e.name.toLowerCase().includes(query)) return false;
        if (muscle && !e.primaryMuscles.includes(muscle)) return false;
        if (equip && !e.equipment.includes(equip)) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, q, muscle, equip]);

  if (!exercises) return <div className="h-40 animate-pulse rounded-2xl bg-surface" />;

  return (
    <div className="space-y-4 animate-fade-up">
      <header>
        <h1 className="font-display text-2xl font-bold">Library</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} exercises</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search exercises…"
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={muscle}
          onChange={(e) => setMuscle(e.target.value)}
          className="h-11 rounded-xl border border-input bg-surface-2 px-3 text-sm capitalize text-foreground"
        >
          <option value="">All muscles</option>
          {muscles.map((m) => (
            <option key={m} value={m} className="capitalize">{m}</option>
          ))}
        </select>
        <select
          value={equip}
          onChange={(e) => setEquip(e.target.value)}
          className="h-11 rounded-xl border border-input bg-surface-2 px-3 text-sm capitalize text-foreground"
        >
          <option value="">All equipment</option>
          {equipment.map((m) => (
            <option key={m} value={m} className="capitalize">{m}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.slice(0, 200).map((e) => (
          <Link key={e.id} href={`/library/${e.id}`}>
            <Card className="flex items-center justify-between p-3.5 transition-colors hover:border-ember/40">
              <div className="min-w-0">
                <p className="truncate font-medium">{e.name}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {e.primaryMuscles.slice(0, 2).map((m) => (
                    <Badge key={m} variant="current" className="capitalize">{m}</Badge>
                  ))}
                  {e.equipment
                    .filter((x) => x !== "none")
                    .slice(0, 1)
                    .map((x) => (
                      <Badge key={x} className="capitalize">{x}</Badge>
                    ))}
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Card>
          </Link>
        ))}
        {filtered.length > 200 && (
          <p className="py-2 text-center text-xs text-muted-foreground">
            Showing first 200 — refine your search to see more.
          </p>
        )}
      </div>
    </div>
  );
}
