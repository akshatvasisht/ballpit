"use client";

import React from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { Card, CardContent } from "@/components/ui/card";

interface Stat {
    value: number;
    label: string;
    suffix: string;
    decimals: number;
    color: string;
}

const STATS: Stat[] = [
    { value: 400, label: "Block Time (Solana)", suffix: "ms", decimals: 0, color: "var(--electric-cyan)" },
    { value: 0.000005, label: "Cost Per Vote", suffix: " SOL", decimals: 6, color: "var(--warm-amber)" },
    { value: 50000, label: "Solana Network TPS", suffix: "+", decimals: 0, color: "var(--sage-green)" },
];

/**
 * Animated stats ticker displaying real-time network performance metrics.
 */
export function StatsTicker() {
    return (
        <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 container mx-auto px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
        >
            {STATS.map((stat, i) => (
                <Card key={i} className="text-center bg-white/80 backdrop-blur-sm">
                    <CardContent className="pt-6">
                        <div className="text-4xl font-mono font-bold" style={{ color: stat.color }}>
                            <CountUp
                                end={stat.value}
                                duration={2.5}
                                decimals={stat.decimals}
                                suffix={stat.suffix}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
                    </CardContent>
                </Card>
            ))}
        </motion.div>
    );
}
