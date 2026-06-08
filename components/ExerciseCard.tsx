import Link from "next/link";
import type { ParsedExercise } from "@/lib/exercises";

export default function ExerciseCard({ exercise }: { exercise: ParsedExercise }) {
  return (
    <Link
      href={`/exercises/${exercise.slug}`}
      className="card flex flex-col gap-3 p-4 transition-colors hover:border-brand-500"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-tight">{exercise.name}</h3>
        <span className="chip shrink-0 capitalize">{exercise.category}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {exercise.primaryMuscles.slice(0, 3).map((m) => (
          <span key={m} className="chip capitalize text-brand-300">
            {m}
          </span>
        ))}
        {exercise.equipment
          .filter((e) => e !== "none")
          .slice(0, 2)
          .map((e) => (
            <span key={e} className="chip capitalize">
              {e}
            </span>
          ))}
      </div>
    </Link>
  );
}
