// Reference targets for the "My Protocol" screen (lightweight, not a macro tracker).

export const NUTRITION = [
  { label: "Calories", value: "3,000–3,200 kcal/day" },
  { label: "Protein", value: "160–180 g/day" },
  { label: "Carbs", value: "High — rice, oats, potatoes" },
  { label: "Fats", value: "60–70 g/day minimum" },
  { label: "Pre-training", value: "Solid meal 1–2h before training" },
];

export const SLEEP = [
  "8–9h minimum every night",
  "Same bedtime nightly",
  "No phone 30–45 min before bed",
  "Room cold (18–20°C) and dark",
  "Optional 20-min pre-training nap",
];

// The daily check-off items (kept intentionally minimal).
export const PROTOCOL_CHECKS = [
  { key: "atePreWorkout", label: "Ate a solid pre-workout meal" },
  { key: "hitProtein", label: "Hit protein target (160–180g)" },
  { key: "sleptEnough", label: "Slept 8–9h" },
  { key: "noPhoneBeforeBed", label: "No phone before bed" },
] as const;
