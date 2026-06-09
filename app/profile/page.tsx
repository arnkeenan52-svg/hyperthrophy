"use client";

import { useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { Download, Dumbbell, Moon, Upload, UtensilsCrossed } from "lucide-react";
import { db } from "@/lib/db";
import { useProfile, useSettings } from "@/hooks/useDb";
import { CURRENT_LIFTS } from "@/lib/data/program";
import { NUTRITION, PROTOCOL_CHECKS, SLEEP } from "@/lib/data/protocol";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exportData, importData } from "@/lib/backup";
import { dateKey } from "@/lib/utils";

export default function ProfilePage() {
  const profile = useProfile();
  const settings = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);

  const today = useLiveQuery(() => db.protocolDays.where("date").equals(dateKey()).first());

  async function setProfile(patch: Record<string, unknown>) {
    await db.profile.update("me", { ...patch, updatedAt: Date.now() });
  }

  async function toggleCheck(key: string, value: boolean) {
    const d = dateKey();
    const existing = await db.protocolDays.where("date").equals(d).first();
    if (existing) await db.protocolDays.update(existing.id!, { [key]: value });
    else
      await db.protocolDays.add({
        date: d,
        atePreWorkout: false,
        hitProtein: false,
        sleptEnough: false,
        noPhoneBeforeBed: false,
        [key]: value,
      } as never);
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importData(file);
      toast.success("Backup restored");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (!profile) return <div className="h-40 animate-pulse rounded-2xl bg-surface" />;

  return (
    <div className="space-y-5 animate-fade-up">
      <header>
        <h1 className="font-display text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Your stats, lifts & protocol</p>
      </header>

      {/* Profile stats */}
      <Card className="space-y-3 p-4">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Age" value={profile.age} onChange={(v) => setProfile({ age: v })} />
          <Field label="Height cm" value={profile.heightCm} onChange={(v) => setProfile({ heightCm: v })} />
          <BwField />
        </div>
        <div>
          <Label className="mb-1 block">Goal focus</Label>
          <textarea
            value={profile.goalFocus}
            onChange={(e) => setProfile({ goalFocus: e.target.value })}
            rows={3}
            className="w-full rounded-xl border border-input bg-surface-2 p-3 text-sm text-foreground"
          />
        </div>
      </Card>

      {/* Current lifts reference */}
      <Card className="p-4">
        <h3 className="mb-3 flex items-center gap-2 font-display font-semibold">
          <Dumbbell className="size-4 text-ember" /> Current lifts
        </h3>
        <div className="space-y-2">
          {CURRENT_LIFTS.map((l) => (
            <div key={l.lift} className="flex items-center justify-between text-sm">
              <span>{l.lift}</span>
              <span className="stat-num text-muted-foreground">{l.detail}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Your starting references for the 12-week program.
        </p>
      </Card>

      {/* Today's protocol checks */}
      <Card className="p-4">
        <h3 className="mb-3 font-display font-semibold">Today&apos;s protocol</h3>
        <div className="space-y-3">
          {PROTOCOL_CHECKS.map((c) => (
            <div key={c.key} className="flex items-center justify-between">
              <span className="text-sm">{c.label}</span>
              <Switch
                checked={Boolean((today as unknown as Record<string, unknown>)?.[c.key])}
                onCheckedChange={(v) => toggleCheck(c.key, v)}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Nutrition reference */}
      <Card className="p-4">
        <h3 className="mb-3 flex items-center gap-2 font-display font-semibold">
          <UtensilsCrossed className="size-4 text-ember" /> Nutrition targets
        </h3>
        <div className="space-y-2">
          {NUTRITION.map((n) => (
            <div key={n.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{n.label}</span>
              <span className="text-right font-medium">{n.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Sleep reference */}
      <Card className="p-4">
        <h3 className="mb-3 flex items-center gap-2 font-display font-semibold">
          <Moon className="size-4 text-current" /> Sleep
        </h3>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {SLEEP.map((s) => (
            <li key={s} className="flex gap-2">
              <span className="text-current">•</span> {s}
            </li>
          ))}
        </ul>
      </Card>

      {/* Settings + backup */}
      <Card className="space-y-3 p-4">
        <h3 className="font-display font-semibold">Settings</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm">Haptics</span>
          <Switch
            checked={settings?.hapticsOn ?? true}
            onCheckedChange={(v) => db.settings.update("app", { hapticsOn: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Rest timer alert</span>
          <Switch
            checked={settings?.restSoundOn ?? true}
            onCheckedChange={(v) => db.settings.update("app", { restSoundOn: v })}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={() => exportData().then(() => toast.success("Backup downloaded"))}>
            <Download className="size-4" /> Export
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Import
          </Button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
        </div>
      </Card>

      <Badge className="mx-auto block w-fit">Local-first · data stays on this device</Badge>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label className="mb-1 block text-xs">{label}</Label>
      <Input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="text-center font-mono tabular-nums"
      />
    </div>
  );
}

function BwField() {
  const bw = useLiveQuery(() => db.bodyweight.orderBy("date").last());
  return (
    <div>
      <Label className="mb-1 block text-xs">Weight kg</Label>
      <Input
        type="number"
        inputMode="decimal"
        defaultValue={bw?.weightKg ?? ""}
        onBlur={async (e) => {
          const w = Number(e.target.value);
          if (!w) return;
          const d = dateKey();
          const ex = await db.bodyweight.where("date").equals(d).first();
          if (ex) await db.bodyweight.update(ex.id!, { weightKg: w });
          else await db.bodyweight.add({ date: d, weightKg: w });
        }}
        className="text-center font-mono tabular-nums"
      />
    </div>
  );
}
