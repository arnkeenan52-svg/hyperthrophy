import type { Exercise } from "@prisma/client";

/** Convert an exercise name into a URL-safe slug. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Muscle-group → member muscles, mirroring the exercemus dataset. */
export const MUSCLE_GROUPS: Record<string, string[]> = {
  arms: ["biceps", "triceps", "forearms"],
  back: ["lats", "middle back", "lower back", "traps"],
  calves: ["calves"],
  chest: ["chest"],
  core: ["abs", "abdominals"],
  legs: ["quadriceps", "hamstrings", "glutes", "adductors", "abductors"],
  shoulders: ["shoulders", "neck"],
};

export type ParsedExercise = Omit<
  Exercise,
  "equipment" | "primaryMuscles" | "secondaryMuscles" | "instructions" | "tips" | "images"
> & {
  equipment: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  tips: string[];
  images: string[];
};

function arr(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

/** Parse JSON-encoded list columns back into arrays for rendering. */
export function parseExercise(e: Exercise): ParsedExercise {
  return {
    ...e,
    equipment: arr(e.equipment),
    primaryMuscles: arr(e.primaryMuscles),
    secondaryMuscles: arr(e.secondaryMuscles),
    instructions: arr(e.instructions),
    tips: arr(e.tips),
    images: arr(e.images),
  };
}

/** Turn a YouTube watch/share URL into an embeddable URL, if possible. */
export function toEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  const watch = url.match(/[?&]v=([^&]+)/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  const short = url.match(/youtu\.be\/([^?]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  return url;
}
