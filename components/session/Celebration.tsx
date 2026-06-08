"use client";

import { AnimatePresence, motion } from "framer-motion";

interface Props {
  show: boolean;
}

const particles = Array.from({ length: 14 });

/** A brief ember/gold burst for PRs. */
export function Celebration({ show }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          {particles.map((_, i) => {
            const angle = (i / particles.length) * Math.PI * 2;
            const dist = 120 + Math.random() * 80;
            return (
              <motion.span
                key={i}
                initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                animate={{
                  opacity: 0,
                  x: Math.cos(angle) * dist,
                  y: Math.sin(angle) * dist,
                  scale: 0.3,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="absolute size-2.5 rounded-full"
                style={{
                  background: i % 2 === 0 ? "#ff7a1a" : "#fbbf24",
                  boxShadow: "0 0 8px currentColor",
                }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
