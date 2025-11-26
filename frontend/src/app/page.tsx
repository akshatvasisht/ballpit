"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { IsometricBg } from "@/components/ui/isometric-bg";
import { useVerification } from "./providers/verifyProvider";

// Landing page sections
import { Hero } from "@/components/landing/hero";
import { StatsTicker } from "@/components/landing/stats-ticker";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TechShowcase } from "@/components/landing/tech-showcase";
import { HybridArch } from "@/components/landing/hybrid-arch";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

/**
 * Main Landing Page entry point.
 * 
 * Conducts shareholders through the onboarding journey:
 * 1. Verification status check (auto-redirect if already verified)
 * 2. Value proposition (Hero & Features)
 * 3. Technical educational content (TechShowcase & Hybrid Architecture)
 * 4. Interactive brand experience (Ballpit Demo)
 */
export default function Home() {
  const { status } = useVerification();
  const router = useRouter();
  const isVerified = status === "success";

  // Auto-redirect verified users to the voting dashboard
  useEffect(() => {
    if (isVerified) {
      router.push("/vote");
    }
  }, [isVerified, router]);

  return (
    <IsometricBg className="min-h-screen">
      <div className="relative z-10 antialiased">
        <Hero />
        <StatsTicker />
        <Features />
        <HowItWorks />
        <TechShowcase />
        <HybridArch />

        <CTA />
        <Footer />
      </div>
    </IsometricBg>
  );
}
