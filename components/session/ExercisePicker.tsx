"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  onPick: (exercise: { id: string; name: string }) => void;
  trigger?: React.ReactNode;
}

export function ExercisePicker({ onPick, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const results = useLiveQuery(async () => {
    const query = q.toLowerCase().trim();
    if (!query) return db.exercises.limit(30).toArray();
    const all = await db.exercises.toArray();
    return all
      .filter((e) => e.name.toLowerCase().includes(query))
      .slice(0, 40);
  }, [q]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger ?? (
          <Button variant="secondary" className="w-full">
            <Plus className="size-4" /> Add exercise
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent className="px-4 pb-6">
        <DrawerTitle className="mb-3 mt-4">Add exercise</DrawerTitle>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search exercises…"
            className="pl-9"
          />
        </div>
        <div className="max-h-[55vh] space-y-1 overflow-auto">
          {(results ?? []).map((e) => (
            <button
              key={e.id}
              onClick={() => {
                onPick({ id: e.id, name: e.name });
                setOpen(false);
                setQ("");
              }}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-2/40 px-3 py-2.5 text-left active:scale-[0.99]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{e.name}</p>
                <p className="truncate text-xs capitalize text-muted-foreground">
                  {e.primaryMuscles.join(", ") || e.category}
                </p>
              </div>
              <Plus className="size-4 shrink-0 text-ember" />
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
