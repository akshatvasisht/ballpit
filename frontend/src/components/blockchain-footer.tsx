"use client";

import { ExternalLink } from "lucide-react";
import { SOLANA_CONFIG, PROGRAM_IDS, getExplorerUrl, formatPublicKey } from "@/lib/constants";

export function BlockchainFooter() {
  return (
    <footer className="border-t border-[var(--slate-blue)]/10 bg-white/50 py-6 mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          {/* Network Info */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[var(--warm-amber)] animate-pulse" />
              <span className="font-semibold">Network:</span>
              <span className="text-[var(--warm-amber)] font-mono uppercase">{SOLANA_CONFIG.network}</span>
            </div>
          </div>

          {/* Program ID */}
          <div className="flex items-center gap-2">
            <span className="font-semibold">Program:</span>
            <a
              href={getExplorerUrl('address', PROGRAM_IDS.votingProgram)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[var(--electric-cyan)] hover:underline inline-flex items-center gap-1"
            >
              {formatPublicKey(PROGRAM_IDS.votingProgram, 6)}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Built with */}
          <div className="text-center md:text-right">
            Built with <span className="text-[var(--electric-cyan)] font-semibold">Anchor</span> on{" "}
            <span className="text-[var(--sage-green)] font-semibold">Solana</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
