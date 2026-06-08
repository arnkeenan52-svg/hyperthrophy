import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hyperthrophy",
  description: "Browse exercises and track your hypertrophy training.",
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/exercises", label: "Exercises" },
  { href: "/workouts", label: "Workouts" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
              <span className="text-xl">🏋️</span>
              <span>
                hyper<span className="text-brand-500">throphy</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--muted)]">
          Exercise data from the open-source{" "}
          <a
            href="https://github.com/exercemus/exercises"
            className="underline hover:text-[var(--text)]"
          >
            exercemus
          </a>{" "}
          dataset.
        </footer>
      </body>
    </html>
  );
}
