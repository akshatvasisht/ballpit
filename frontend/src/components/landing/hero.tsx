"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
const Ballpit = dynamic(() => import("@/components/ui/ballpit"), { ssr: false });

/**
 * Hero section for the landing page.
 * Displays the core value proposition and primary call-to-action.
 */
export function Hero() {
    // Calculate container dimensions from standard bounds (scale factor to convert 3D units to pixels)
    // Add 20% buffer to prevent clipping at edges
    const scaleFactor = 25; // pixels per unit
    const bufferFactor = 1.2; // 20% extra space
    const containerWidth = 34 * scaleFactor * bufferFactor; // width: 34
    const containerHeight = 10 * scaleFactor * bufferFactor; // height: 10

    return (
        <section className="relative container mx-auto px-6 pt-10 pb-12">
            <div className="relative max-w-6xl mx-auto">
                {/* Logo with Ballpit background */}
                <div className="relative">
                    {/* Ballpit behind logo - dynamically sized from bounds */}
                    <div
                        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2 pointer-events-none"
                        style={{ width: `${containerWidth}px`, height: `${containerHeight}px` }}
                    >
                        <Ballpit />
                    </div>

                    {/* Logo */}
                    <motion.div
                        className="relative z-10 mb-6 flex justify-center"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Image
                            src="/logo.png"
                            alt="Ballpit Logo"
                            width={600}
                            height={150}
                            priority
                            className="h-auto w-full max-w-md"
                        />
                    </motion.div>
                </div>

                {/* Hero Content */}
                <motion.div
                    className="relative z-10 text-center space-y-6 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto">
                        Blockchain Governance for{" "}
                        <span className="text-[var(--sage-green)]">Modern Companies</span>
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                        Secure, transparent shareholder voting powered by Solana.
                        Tokenized shares meet institutional governance.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
                        <Button size="lg" asChild className="min-w-[200px]">
                            <Link href="/verify">
                                Get Started <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="secondary" asChild className="min-w-[200px]">
                            <Link href="/vote">View Live Dashboard</Link>
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
