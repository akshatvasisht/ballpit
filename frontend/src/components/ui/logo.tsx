/**
 * Logo Component
 * Centralized logo component for consistent usage across the app
 */

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
}

const sizeMap = {
  sm: { width: 266, height: 143 },
  md: { width: 533, height: 286 },
  lg: { width: 666, height: 358 },
  xl: { width: 800, height: 430 },
};

export function Logo({ size = "md", className, priority = false }: LogoProps) {
  const dimensions = sizeMap[size];

  return (
    <Image
      src="/logo.png"
      alt="Ballpit - Blockchain Governance Platform"
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
      className={cn("h-auto w-full", className)}
    />
  );
}

/**
 * Logo Icon Only (cube without text)
 * For favicons, app icons, or compact displays
 */
export function LogoIcon({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <Image
        src="/logo.png"
        alt="Ballpit Icon"
        width={size}
        height={size}
        className="object-contain object-left"
        style={{ clipPath: "inset(0 70% 0 0)" }}
      />
    </div>
  );
}
