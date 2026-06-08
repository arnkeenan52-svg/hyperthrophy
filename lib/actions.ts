"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createWorkout(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim() || "Untitled workout";
  const workout = await prisma.workout.create({ data: { name } });
  redirect(`/workouts/${workout.id}`);
}

export async function deleteWorkout(id: number) {
  await prisma.workout.delete({ where: { id } });
  revalidatePath("/workouts");
}

export async function addExercise(workoutId: number, exerciseId: number) {
  const count = await prisma.workoutEntry.count({ where: { workoutId } });
  await prisma.workoutEntry.create({
    data: { workoutId, exerciseId, order: count },
  });
  revalidatePath(`/workouts/${workoutId}`);
}

export async function removeEntry(entryId: number, workoutId: number) {
  await prisma.workoutEntry.delete({ where: { id: entryId } });
  revalidatePath(`/workouts/${workoutId}`);
}

export async function addSet(
  entryId: number,
  workoutId: number,
  weight: number | null,
  reps: number | null,
) {
  const count = await prisma.setLog.count({ where: { entryId } });
  await prisma.setLog.create({
    data: { entryId, weight, reps, order: count },
  });
  revalidatePath(`/workouts/${workoutId}`);
}

export async function removeSet(setId: number, workoutId: number) {
  await prisma.setLog.delete({ where: { id: setId } });
  revalidatePath(`/workouts/${workoutId}`);
}
