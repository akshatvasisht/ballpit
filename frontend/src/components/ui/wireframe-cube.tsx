/**
 * Wireframe Cube SVG Component
 * Decorative isometric cube matching the logo aesthetic
 */

import { cn } from "@/lib/utils";

interface WireframeCubeProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
}

export function WireframeCube({
  className,
  size = 200,
  strokeWidth = 1.5,
  animated = false,
}: WireframeCubeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("opacity-20", className)}
    >
      {/* Back face */}
      <path
        d="M60 40 L140 40 L140 120 L60 120 Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? "animate-pulse" : ""}
      />

      {/* Front face */}
      <path
        d="M40 80 L120 80 L120 160 L40 160 Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Connecting edges (creates 3D effect) */}
      <line
        x1="60"
        y1="40"
        x2="40"
        y2="80"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <line
        x1="140"
        y1="40"
        x2="120"
        y2="80"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <line
        x1="140"
        y1="120"
        x2="120"
        y2="160"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <line
        x1="60"
        y1="120"
        x2="40"
        y2="160"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Wireframe Cube with Spheres (matches logo)
 */
export function WireframeCubeWithSpheres({
  className,
  size = 200,
}: {
  className?: string;
  size?: number;
}) {
  const sphereColors = [
    "var(--slate-blue)",
    "var(--sage-green)",
    "var(--dusty-rose)",
    "var(--warm-amber)",
    "var(--electric-cyan)",
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("opacity-30", className)}
    >
      {/* Wireframe cube */}
      <WireframeCube size={size} />

      {/* Spheres inside (simplified grid) */}
      {[
        { x: 70, y: 100, color: sphereColors[0] },
        { x: 90, y: 100, color: sphereColors[1] },
        { x: 110, y: 100, color: sphereColors[2] },
        { x: 70, y: 120, color: sphereColors[3] },
        { x: 90, y: 120, color: sphereColors[4], glow: true },
        { x: 110, y: 120, color: sphereColors[0] },
      ].map((sphere, i) => (
        <circle
          key={i}
          cx={sphere.x}
          cy={sphere.y}
          r="6"
          fill={sphere.color}
          opacity={sphere.glow ? 1 : 0.7}
          className={sphere.glow ? "animate-glow-pulse" : ""}
        />
      ))}
    </svg>
  );
}
