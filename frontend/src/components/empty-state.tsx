"use client";

import { Vote } from "lucide-react";

interface EmptyStateProps {
    message?: string;
}

export function EmptyState({ message = "No data available." }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-[var(--slate-blue)]/20 bg-white/50 py-16 px-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--electric-cyan)]/10 border border-[var(--electric-cyan)]/20">
                <Vote className="h-7 w-7 text-[var(--electric-cyan)]" strokeWidth={1.5} />
            </div>
            <p className="text-base font-semibold text-muted-foreground">{message}</p>
        </div>
    );
}
