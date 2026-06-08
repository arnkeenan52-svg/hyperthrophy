"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Props = {
  groups: string[];
  categories: string[];
  equipment: string[];
};

export default function ExerciseFilters({ groups, categories, equipment }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page");
      router.push(`/exercises?${next.toString()}`);
    },
    [params, router],
  );

  // Debounce the search box so we don't push on every keystroke.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => update("q", q), 300);
    return () => clearTimeout(t);
  }, [q, params, update]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <input
        className="input"
        placeholder="Search exercises…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <Select
        label="Muscle group"
        value={params.get("group") ?? ""}
        options={groups}
        onChange={(v) => update("group", v)}
      />
      <Select
        label="Category"
        value={params.get("category") ?? ""}
        options={categories}
        onChange={(v) => update("category", v)}
      />
      <Select
        label="Equipment"
        value={params.get("equipment") ?? ""}
        options={equipment}
        onChange={(v) => update("equipment", v)}
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      className="input capitalize"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">All {label.toLowerCase()}</option>
      {options.map((o) => (
        <option key={o} value={o} className="capitalize">
          {o}
        </option>
      ))}
    </select>
  );
}
