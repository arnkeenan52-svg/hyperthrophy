# Hyperthrophy

A personal, **local-first** hypertrophy training tracker — pre-loaded with my
exact 5-day program, lifts, and intensity rules. Open it, log my training, track
progress. No accounts, no server, no setup; data lives on my device.

Built with **Next.js (App Router) · TypeScript · Tailwind (shadcn-style UI) ·
Dexie/IndexedDB · Recharts · Framer Motion**, installable as a **PWA** that works
offline.

## Highlights

- **Ships ready to lift.** First launch seeds my profile, the 5-day split, my
  current lifts, and an 800+ exercise library — start logging Day 1 immediately.
- **Fast set logging** — big mono inputs, one-tap set completion with haptics, a
  per-exercise rest timer that auto-starts at the prescribed rest.
- **Progressive-overload engine** — after each exercise it suggests next
  session's weight (barbell +2.5kg · dumbbell +2kg · machine/cable +5kg) and
  pre-fills it with an acceptable "+2.5kg suggested" hint.
- **RIR / intensity cues** — most sets 1–2 RIR, last set 0 RIR allowed; big
  compounds (Bench/Squat/Row) are capped at 1 RIR with a clear "never to failure"
  reminder.
- **Progress dashboard** — weekly volume, estimated 1RM per lift (pull lifts
  highlighted), bodyweight trend, a 12-week training heatmap, and PRs. A
  **pull-focus** card tracks back/pull volume vs pressing — my main goal.
- **No deadlifts, anywhere** — excluded from plans, suggestions, and the library.
- **Backup** — JSON export/import for safekeeping.

## Pages

`Home` dashboard · `Session` (log today) · `Plans` (view/edit the split) ·
`Progress` (charts & history) · `Library` (exercise database) ·
`Profile / My Protocol` (stats, lifts, nutrition & sleep reference, settings).

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

The database seeds itself in the browser on first load. To reset, clear the
site's IndexedDB (or use a fresh profile).

```bash
npm run build && npm start   # production
npm run verify               # logic + data-model checks
npm run verify:db            # seeds against the real dataset (fake-indexeddb)
```

## Architecture

- **`lib/db/`** — Dexie schema (`types.ts`) and seeding (`index.ts`). Stores:
  `profile`, `bodyweight`, `exercises`, `plans`/`planExercises`,
  `sessions`/`sessionExercises`/`setLogs`, `oneRmRefs`, `settings`,
  `protocolDays`.
- **`lib/engine/`** — pure training logic: `overload.ts`, `rir.ts`,
  `oneRepMax.ts` (Brzycki), `stats.ts` (volume, streaks, PRs, pull/press
  balance). Fully unit-tested in `scripts/verify.ts`.
- **`lib/data/program.ts`** — my 5-day split, seed lifts, and 1RM references.
- **`lib/session.ts`** — session lifecycle + overload-aware weight suggestions.
- **`components/`** — `ui/` primitives, `session/`, `progress/`, `shell/`.

## Data attribution

Exercise library from the open-source
[exercemus/exercises](https://github.com/exercemus/exercises) dataset (curated
from wger and exercises.json). Design and patterns informed by
[workout-cool](https://github.com/Snouzy/workout-cool) and
[wger](https://github.com/wger-project/wger).
