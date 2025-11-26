"use client";

import React from "react";
import { ShieldCheck, LockKeyhole, CircleCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Hybrid architecture section explaining the separation between on-chain and off-chain layers.
 */
export function HybridArch() {
    return (
        <section className="container mx-auto px-6 py-16">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-4">Why Hybrid Architecture?</h2>
                <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
                    Ballpit combines on-chain transparency with off-chain compliance for institutional-grade governance.
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* On-Chain Section */}
                    <Card className="border-[var(--sage-green)]/30 bg-[var(--sage-green)]/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-[var(--sage-green)]" />
                                On-Chain (Solana)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <CircleCheck className="h-4 w-4 text-[var(--sage-green)] mt-0.5 flex-shrink-0" />
                                    <span>Vote casting & tallying (immutable, verifiable)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CircleCheck className="h-4 w-4 text-[var(--sage-green)] mt-0.5 flex-shrink-0" />
                                    <span>Cryptographic receipts (double-vote prevention)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CircleCheck className="h-4 w-4 text-[var(--sage-green)] mt-0.5 flex-shrink-0" />
                                    <span>Delegation logic (trustless proxy voting)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CircleCheck className="h-4 w-4 text-[var(--sage-green)] mt-0.5 flex-shrink-0" />
                                    <span>Audit trail (permanent, tamper-proof)</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Off-Chain Section */}
                    <Card className="border-[var(--slate-blue)]/30 bg-[var(--slate-blue)]/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LockKeyhole className="h-5 w-5 text-[var(--slate-blue)]" />
                                Off-Chain (Compliant)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <LockKeyhole className="h-4 w-4 text-[var(--slate-blue)] mt-0.5 flex-shrink-0" />
                                    <span>KYC verification (SEC/regulatory requirement)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <LockKeyhole className="h-4 w-4 text-[var(--slate-blue)] mt-0.5 flex-shrink-0" />
                                    <span>Real name registry (legal compliance & audit)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <LockKeyhole className="h-4 w-4 text-[var(--slate-blue)] mt-0.5 flex-shrink-0" />
                                    <span>Document storage (identity verification)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <LockKeyhole className="h-4 w-4 text-[var(--slate-blue)] mt-0.5 flex-shrink-0" />
                                    <span>Privacy protection (pseudonymous voting)</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8 p-6 rounded-lg bg-[var(--warm-amber)]/10 border border-[var(--warm-amber)]/30">
                    <p className="text-sm text-center text-foreground leading-relaxed">
                        <strong>Best of both worlds:</strong> Blockchain ensures vote integrity and transparency, while off-chain KYC
                        maintains regulatory compliance and shareholder privacy. This separation of concerns is the industry standard
                        for institutional blockchain applications.
                    </p>
                </div>
            </div>
        </section>
    );
}
