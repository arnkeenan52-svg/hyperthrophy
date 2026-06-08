"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import { formatClock } from "@/lib/utils";

interface Props {
  seconds: number;
  /** Changing this key (re)starts the countdown — e.g. on set completion. */
  runKey: number;
  onDismiss: () => void;
}

export function RestTimer({ seconds, runKey, onDismiss }: Props) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(true);
  const endRef = useRef<number>(Date.now() + seconds * 1000);

  // (Re)start whenever runKey changes.
  useEffect(() => {
    setRemaining(seconds);
    setRunning(true);
    endRef.current = Date.now() + seconds * 1000;
  }, [runKey, seconds]);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.([120, 60, 120]);
        }
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running, runKey]);

  function toggle() {
    if (running) {
      setRunning(false);
    } else {
      endRef.current = Date.now() + remaining * 1000;
      setRunning(true);
    }
  }

  function reset() {
    setRemaining(seconds);
    endRef.current = Date.now() + seconds * 1000;
    setRunning(true);
  }

  const pct = seconds > 0 ? remaining / seconds : 0;
  const r = 16;
  const circ = 2 * Math.PI * r;
  const done = remaining <= 0;

  return (
    <div className="fixed inset-x-0 bottom-[72px] z-30 flex justify-center px-4">
      <div className="glass flex items-center gap-3 rounded-2xl px-3 py-2 shadow-2xl">
        <div className="relative size-9">
          <svg viewBox="0 0 40 40" className="size-9 -rotate-90">
            <circle cx="20" cy="20" r={r} className="fill-none stroke-surface-2" strokeWidth="4" />
            <circle
              cx="20"
              cy="20"
              r={r}
              className={done ? "fill-none stroke-current" : "fill-none stroke-ember"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct)}
              style={{ transition: "stroke-dashoffset 0.3s linear" }}
            />
          </svg>
        </div>
        <div className="min-w-[68px]">
          <p className="font-mono text-lg font-bold tabular-nums leading-none">
            {formatClock(remaining)}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {done ? "Rest done" : "Rest"}
          </p>
        </div>
        <button onClick={toggle} className="flex size-9 items-center justify-center rounded-xl bg-surface-2 active:scale-95">
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <button onClick={reset} className="flex size-9 items-center justify-center rounded-xl bg-surface-2 active:scale-95">
          <RotateCcw className="size-4" />
        </button>
        <button onClick={onDismiss} className="flex size-9 items-center justify-center rounded-xl text-muted-foreground active:scale-95">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
