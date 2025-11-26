/**
 * Isometric Grid Background Component
 * Creates a subtle 30-degree angle grid pattern matching the logo aesthetic
 */

import { cn } from "@/lib/utils";

interface IsometricBgProps {
  className?: string;
  children?: React.ReactNode;
  opacity?: number;
}

export function IsometricBg({ className, children, opacity = 0.03 }: IsometricBgProps) {
  return (
    <div className={cn("relative w-full h-full", className)}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              30deg,
              transparent,
              transparent 35px,
              rgba(42, 42, 42, ${opacity}) 35px,
              rgba(42, 42, 42, ${opacity}) 36px
            ),
            repeating-linear-gradient(
              -30deg,
              transparent,
              transparent 35px,
              rgba(42, 42, 42, ${opacity}) 35px,
              rgba(42, 42, 42, ${opacity}) 36px
            )
          `,
        }}
      />
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
