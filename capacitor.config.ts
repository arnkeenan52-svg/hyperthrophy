import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "dk.quartzmolle.hyperthrophy",
  appName: "Hyperthrophy",
  // Next static export output (built with `npm run cap:build`).
  webDir: "out",
  ios: {
    contentInset: "always",
  },
};

export default config;
