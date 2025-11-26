"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Call-to-action section at the bottom of the landing page.
 */
export function CTA() {
    return (
        <section className="container mx-auto px-6 py-16">
            <Card className="max-w-4xl mx-auto bg-gradient-to-r from-[var(--electric-cyan)]/10 to-[var(--slate-blue)]/10 border-[var(--electric-cyan)]/50 shadow-xl overflow-hidden">
                <CardContent className="p-12 text-center relative overflow-hidden">
                    {/* Subtle background glow */}
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--electric-cyan)0%,transparent_70%)] opacity-5 pointer-events-none" />

                    <h2 className="text-3xl font-bold mb-4 relative z-10">
                        Ready to Transform Your Governance?
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8 relative z-10">
                        Join companies using blockchain for transparent shareholder voting.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                        <Button size="lg" asChild className="px-8 shadow-md">
                            <Link href="/verify">Start Verification</Link>
                        </Button>
                        <Button size="lg" variant="secondary" asChild className="px-8">
                            <Link href="/admin?admin=true">Company Admin Portal</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
