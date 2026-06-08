# hyperthrophy

A focused **hypertrophy training** web app: browse a database of 800+ exercises
and log your sets and reps to drive progressive overload.

Built with **Next.js (App Router) · TypeScript · Prisma · SQLite · Tailwind CSS**.

## Features

- **Exercise database** — 872 exercises seeded from the open-source
  [exercemus](https://github.com/exercemus/exercises) dataset.
  - Search by name, filter by muscle group, category, and equipment.
  - Detail pages with instructions, primary/secondary muscles, tips, and a
    video demonstration where available.
- **Workout tracker** — create training sessions, add exercises, and log each
  working set (weight × reps). Per-exercise and total **volume** is computed
  automatically.

## Getting started

```bash
npm install            # install dependencies
npm run db:reset       # create the SQLite schema and seed exercises
npm run dev            # start the dev server at http://localhost:3000
```

### Useful scripts

| Script              | Description                                      |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start the Next.js dev server                     |
| `npm run build`     | Generate the Prisma client and build for prod    |
| `npm run start`     | Run the production build                         |
| `npm run db:push`   | Sync the Prisma schema to the database           |
| `npm run db:seed`   | Seed exercises from `data/exercises.json`        |
| `npm run db:reset`  | Reset the database and reseed                     |

## Project structure

```
app/                     # Next.js App Router pages
  page.tsx               # dashboard
  exercises/             # exercise list + detail
  workouts/              # workout list + detail (logging)
components/              # client UI (filters, pickers, set logging)
lib/
  prisma.ts              # Prisma client singleton
  exercises.ts           # slug/parsing helpers, muscle groups
  actions.ts             # server actions for workout mutations
prisma/
  schema.prisma          # Exercise, Workout, WorkoutEntry, SetLog
  seed.ts                # dataset importer
data/exercises.json      # bundled exercise dataset
```

## Data model

- `Exercise` — name, slug, category, description, equipment, muscles,
  instructions, tips, video. List fields are stored as JSON strings for
  SQLite compatibility (parsed via `lib/exercises.ts`).
- `Workout` → `WorkoutEntry` → `SetLog` — a session contains exercises, each
  with logged sets.

## Data attribution

Exercise data is from the open-source
[exercemus/exercises](https://github.com/exercemus/exercises) project, itself
curated from [wger](https://github.com/wger-project/wger) and
[exercises.json](https://github.com/wrkout/exercises.json).
