"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group rounded-2xl border border-border bg-surface-2 text-foreground shadow-xl",
          description: "text-muted-foreground",
          actionButton: "bg-ember text-black",
        },
      }}
      {...props}
    />
  );
}
