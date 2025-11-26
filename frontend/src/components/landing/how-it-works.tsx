"use client";

import React from "react";
import { motion } from "framer-motion";

interface Step {
    step: string;
    title: string;
    description: string;
    color: string;
}

const STEPS: Step[] = [
    {
        step: "01",
        title: "Identity Verification",
        description: "Companies verify shareholder identities off-chain using KYC service.",
        color: "var(--sage-green)",
    },
    {
        step: "02",
        title: "Token Issuance",
        description: "Tokenized shares minted as SPL tokens on Solana (one token = one vote).",
        color: "var(--warm-amber)",
    },
    {
        step: "03",
        title: "On-Chain Voting",
        description: "Shareholders vote via VoteAccounts with weighted voting and delegation.",
        color: "var(--electric-cyan)",
    },
    {
        step: "04",
        title: "Audit Trail",
        description: "Off-chain registry maps wallets to verified identities for compliance.",
        color: "var(--slate-blue)",
    },
];

/**
 * Visual step-by-step guide of the application's core workflow.
 */
export function HowItWorks() {
    return (
        <section className="relative container mx-auto px-6 py-16">
            <div className="relative z-10 max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-12" style={{ textShadow: '0 2px 4px rgba(255,255,255,0.8)' }}>How Ballpit Works</h2>

                <div className="space-y-8">
                    {STEPS.map((item, i) => (
                        <motion.div
                            key={i}
                            className="flex gap-6 items-start"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        >
                            <div className="flex-shrink-0">
                                <div
                                    className="w-16 h-16 rounded-lg text-white flex items-center justify-center font-mono font-bold text-xl"
                                    style={{ backgroundColor: item.color }}
                                >
                                    {item.step}
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                <p className="text-muted-foreground">{item.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
