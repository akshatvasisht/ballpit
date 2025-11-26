"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, LockKeyhole, CircleCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Feature {
    icon: React.ElementType;
    title: string;
    description: string;
    color: string;
}

const FEATURES: Feature[] = [
    {
        icon: ShieldCheck,
        title: "Identity Verification",
        description: "Secure KYC process ensures only verified shareholders can participate in governance decisions.",
        color: "var(--sage-green)",
    },
    {
        icon: LockKeyhole,
        title: "Blockchain Security",
        description: "Cryptographically secured votes recorded immutably on Solana's distributed ledger.",
        color: "var(--slate-blue)",
    },
    {
        icon: CircleCheck,
        title: "Transparent Tallying",
        description: "Real-time vote results with complete audit trail and instant finalization.",
        color: "var(--electric-cyan)",
    },
];

/**
 * Features grid highlighting the core pillars of the application.
 */
export function Features() {
    return (
        <section className="container mx-auto px-6 py-16">
            <motion.div
                className="max-w-6xl mx-auto"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
            >
                <h2 className="text-3xl font-bold text-center mb-12">Why Ballpit?</h2>

                <div className="grid md:grid-cols-3 gap-8">
                    {FEATURES.map((feature, i) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                            >
                                <Card interactive className="h-full">
                                    <CardHeader>
                                        <div
                                            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                                            style={{ backgroundColor: `${feature.color}20` }}
                                        >
                                            <Icon
                                                className="w-6 h-6"
                                                style={{ color: feature.color }}
                                                strokeWidth={2}
                                            />
                                        </div>
                                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-base text-muted-foreground">
                                            {feature.description}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </section>
    );
}
