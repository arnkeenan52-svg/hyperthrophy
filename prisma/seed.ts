import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { slugify } from "../lib/exercises";

const prisma = new PrismaClient();

type RawExercise = {
  name: string;
  category?: string;
  description?: string;
  equipment?: string[];
  primary_muscles?: string[];
  secondary_muscles?: string[];
  instructions?: string[];
  tips?: string[];
  video?: string;
  images?: string[];
};

type Dataset = {
  categories: string[];
  equipment: string[];
  muscles: string[];
  exercises: RawExercise[];
};

async function main() {
  const file = join(process.cwd(), "data", "exercises.json");
  const data = JSON.parse(readFileSync(file, "utf-8")) as Dataset;

  console.log(`Seeding ${data.exercises.length} exercises...`);

  await prisma.setLog.deleteMany();
  await prisma.workoutEntry.deleteMany();
  await prisma.exercise.deleteMany();

  // De-duplicate by slug (the dataset has a few colliding names).
  const seen = new Set<string>();
  const rows = [];
  for (const e of data.exercises) {
    if (!e.name) continue;
    let slug = slugify(e.name);
    if (!slug) continue;
    let suffix = 2;
    while (seen.has(slug)) slug = `${slugify(e.name)}-${suffix++}`;
    seen.add(slug);

    rows.push({
      slug,
      name: e.name,
      category: e.category ?? "strength",
      description: e.description ?? null,
      equipment: JSON.stringify(e.equipment ?? []),
      primaryMuscles: JSON.stringify(e.primary_muscles ?? []),
      secondaryMuscles: JSON.stringify(e.secondary_muscles ?? []),
      instructions: JSON.stringify(e.instructions ?? []),
      tips: JSON.stringify(e.tips ?? []),
      video: e.video ?? null,
      images: JSON.stringify(e.images ?? []),
    });
  }

  // createMany is fast and fine here since slugs are pre-deduplicated.
  const result = await prisma.exercise.createMany({ data: rows });
  console.log(`Inserted ${result.count} exercises.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
