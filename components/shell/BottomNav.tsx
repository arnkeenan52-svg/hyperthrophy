"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Home, LineChart, ListChecks, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/session", label: "Train", icon: Dumbbell },
  { href: "/plans", label: "Plans", icon: ListChecks },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]">
      {/* fade so content scrolls out cleanly behind the bar */}
      <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background to-transparent" />
      <div className="mx-auto max-w-xl px-3 pb-3">
        <div className="glass flex items-stretch justify-around rounded-2xl px-1.5 py-1 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.7)]">
          {items.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium transition-colors",
                  active ? "text-ember" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <span className="absolute inset-0 rounded-xl bg-ember/10 ring-1 ring-ember/20" />
                )}
                <Icon
                  className={cn(
                    "relative size-5 transition-transform",
                    active && "scale-110 drop-shadow-[0_0_8px_rgba(255,122,26,0.6)]",
                  )}
                />
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
