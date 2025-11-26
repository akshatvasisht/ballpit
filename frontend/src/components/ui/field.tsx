import * as React from "react";

import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

export function Field({ label, children, className }: FieldProps) {
  return (
    <label className={cn("block space-y-1 text-left", className)}>
      <div className="text-xs font-semibold uppercase tracking-wide text-foreground">
        {label}
      </div>
      {children}
    </label>
  );
}
