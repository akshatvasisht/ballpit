/**
 * Sphere Tally Component
 * Visualizes vote counts as clusters of colored spheres (matching logo aesthetic)
 */

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SphereTallyProps {
  votesFor: number;
  votesAgainst: number;
  className?: string;
  showLabels?: boolean;
}

export function SphereTally({
  votesFor,
  votesAgainst,
  className,
  showLabels = true,
}: SphereTallyProps) {
  const total = votesFor + votesAgainst;
  const forPercentage = total > 0 ? (votesFor / total) * 100 : 50;
  const againstPercentage = total > 0 ? (votesAgainst / total) * 100 : 50;

  // Calculate number of spheres to show (max 50 for performance)
  const maxSpheres = 50;
  const forSpheres = Math.round((forPercentage / 100) * maxSpheres);
  const againstSpheres = maxSpheres - forSpheres;

  return (
    <div className={cn("w-full", className)}>
      {/* Vote Bars */}
      <div className="space-y-4">
        {/* For Votes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">For</span>
            {showLabels && (
              <span className="text-sm font-mono text-muted-foreground">
                {votesFor.toLocaleString()} ({forPercentage.toFixed(1)}%)
              </span>
            )}
          </div>
          <div className="relative h-8 rounded-md bg-muted overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-[var(--sage-green)] rounded-md"
              initial={{ width: 0 }}
              animate={{ width: `${forPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            {/* Sphere overlay */}
            <div className="absolute inset-0 flex items-center px-2 gap-0.5">
              {Array.from({ length: forSpheres }).map((_, i) => (
                <motion.div
                  key={`for-${i}`}
                  className="w-1.5 h-1.5 rounded-full bg-white/40"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: i * 0.01,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Against Votes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Against</span>
            {showLabels && (
              <span className="text-sm font-mono text-muted-foreground">
                {votesAgainst.toLocaleString()} ({againstPercentage.toFixed(1)}%)
              </span>
            )}
          </div>
          <div className="relative h-8 rounded-md bg-muted overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-[var(--dusty-rose)] rounded-md"
              initial={{ width: 0 }}
              animate={{ width: `${againstPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            />
            {/* Sphere overlay */}
            <div className="absolute inset-0 flex items-center px-2 gap-0.5">
              {Array.from({ length: againstSpheres }).map((_, i) => (
                <motion.div
                  key={`against-${i}`}
                  className="w-1.5 h-1.5 rounded-full bg-white/40"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: i * 0.01 + 0.1,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Total Count */}
      {showLabels && (
        <div className="mt-4 text-center">
          <span className="text-xs font-mono text-muted-foreground">
            Total Votes: {total.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Sphere Indicator
 * Single-line sphere cluster (for compact displays)
 */
interface SphereIndicatorProps {
  count: number;
  max?: number;
  color?: "sage" | "rose" | "amber" | "cyan" | "slate";
  className?: string;
}

export function SphereIndicator({
  count,
  max = 10,
  color = "cyan",
  className,
}: SphereIndicatorProps) {
  const spheres = Math.min(count, max);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: spheres }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full sphere-indicator",
            color
          )}
        />
      ))}
      {count > max && (
        <span className="text-xs font-mono text-muted-foreground ml-1">
          +{count - max}
        </span>
      )}
    </div>
  );
}
