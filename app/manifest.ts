import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hyperthrophy",
    short_name: "Hyperthrophy",
    description: "Personal hypertrophy training tracker.",
    start_url: "/",
    display: "standalone",
    background_color: "#0C0A09",
    theme_color: "#0C0A09",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
