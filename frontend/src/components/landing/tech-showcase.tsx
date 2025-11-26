"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TechItem {
    title: string;
    description: string;
    tech: string;
    color: string;
}

const TECH_ITEMS: TechItem[] = [
    {
        title: "Program Derived Addresses",
        description: "Deterministic vote receipts prevent double-voting without requiring private keys or additional storage.",
        tech: "Solana PDAs",
        color: "var(--sage-green)",
    },
    {
        title: "SPL Token Integration",
        description: "Share ownership mapped 1:1 to voting power via on-chain token account balances.",
        tech: "Anchor + SPL",
        color: "var(--warm-amber)",
    },
    {
        title: "Rent-Optimized Accounts",
        description: "Efficient account sizing minimizes storage costs to ~$0.000005 per vote.",
        tech: "Solana Runtime",
        color: "var(--electric-cyan)",
    },
];

/**
 * Technical showcase section highlighting specific Solana implementation details.
 */
export function TechShowcase() {
    return (
        <section className="container mx-auto px-6 py-16 bg-white/30 backdrop-blur-sm rounded-3xl">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-4">Under the Hood</h2>
                <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                    Built with production-grade Solana smart contracts and modern Web3 tooling
                </p>

                <div className="grid md:grid-cols-3 gap-8">
                    {TECH_ITEMS.map((item, i) => (
                        <Card key={i} className="bg-white/80">
                            <CardHeader>
                                <div
                                    className="inline-flex px-3 py-1 rounded-full text-xs font-semibold mb-3 border"
                                    style={{
                                        backgroundColor: `${item.color}15`,
                                        color: item.color,
                                        borderColor: `${item.color}30`,
                                    }}
                                >
                                    {item.tech}
                                </div>
                                <CardTitle className="text-lg">{item.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-muted-foreground">{item.description}</CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
