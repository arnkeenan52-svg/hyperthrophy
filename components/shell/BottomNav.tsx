"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Workout", icon: Dumbbell },
  { href: "/profile", label: "Me", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background to-transparent" />
      <div className="mx-auto max-w-xl px-4 pb-3">
        <div className="glass flex items-stretch justify-around rounded-2xl p-1.5 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.7)]">
          {items.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "relative flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors",
                  active ? "text-ember" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <span className="absolute inset-0 rounded-xl bg-ember/10 ring-1 ring-ember/20" />
                )}
                <Icon
                  className={cn(
                    "relative size-5",
                    active && "drop-shadow-[0_0_8px_rgba(191,255,0,0.6)]",
                  )}
                />
                <span className="relative font-display">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
