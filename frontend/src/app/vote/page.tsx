"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Unlock, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/constants";
import { NavHeader } from "@/components/nav-header";
import { EmptyState } from "@/components/empty-state";

interface VoteProposal {
    voteAccount: string;
    title: string;
    votesFor: string;
    votesAgainst: string;
    isActive: boolean;
    authority: string;
    tokenMint: string;
}

export default function GovernanceDashboard() {
    const [proposals, setProposals] = useState<VoteProposal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProposals() {
            try {
                const res = await fetch(getApiUrl("/api/user/votes"));
                if (!res.ok) throw new Error("Failed to fetch votes");
                const data = await res.json();
                setProposals(data.votes);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchProposals();
    }, []);

    const activeProposals = proposals.filter((p) => p.isActive);
    const closedProposals = proposals.filter((p) => !p.isActive);

    return (
        <>
            <NavHeader showBack={true} backHref="/" showHome={true} title="Governance Dashboard" />
            <div className="flex w-full flex-col items-center gap-8 py-12">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight">Governance Dashboard</h1>
                    <p className="mt-3 text-base text-muted-foreground">
                        Review proposals and cast your tokenized votes
                    </p>

                    <div className="mt-6 flex items-center justify-center gap-4">
                        <Button variant="secondary" asChild>
                            <Link href="/vote/history">Voting History</Link>
                        </Button>
                        <Button variant="secondary" asChild>
                            <Link href="/vote/delegate">Delegate Power</Link>
                        </Button>
                    </div>
                </div>

                <div className="w-full max-w-5xl space-y-12">
                    {/* Active Proposals Section */}
                    <section>
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--sage-green)]/10 border border-[var(--sage-green)]/30">
                                <Unlock className="h-6 w-6 text-[var(--sage-green)]" strokeWidth={2} />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Active Proposals</h2>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {loading && (
                                <div className="col-span-2 text-center py-10 font-semibold text-muted-foreground animate-pulse">
                                    Loading Active Proposals...
                                </div>
                            )}
                            {!loading && activeProposals.length === 0 && (
                                <div className="col-span-2">
                                    <EmptyState message="No active proposals. Use the Admin Portal to create one." />
                                </div>
                            )}
                            {activeProposals.map((proposal) => (
                                <div
                                    key={proposal.voteAccount}
                                    className="flex flex-col justify-between rounded-xl border border-[var(--slate-blue)]/20 bg-white/70 p-6 transition-all hover:shadow-lg hover:-translate-y-1 focus-within:-translate-y-1"
                                >
                                    <div>
                                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--sage-green)]/10 border border-[var(--sage-green)]/30 px-3 py-1 text-xs font-semibold tracking-wide text-[var(--sage-green)]">
                                            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--sage-green)]" />
                                            Voting Open
                                        </div>
                                        <h3 className="text-xl font-semibold leading-tight text-foreground">{proposal.title}</h3>
                                        <div className="mt-4 flex gap-6 text-sm font-medium">
                                            <div className="text-muted-foreground">For: <span className="text-[var(--sage-green)] font-semibold">{proposal.votesFor}</span></div>
                                            <div className="text-muted-foreground">Against: <span className="text-[var(--dusty-rose)] font-semibold">{proposal.votesAgainst}</span></div>
                                        </div>
                                    </div>
                                    <Button asChild className="mt-6 h-12 w-full text-base">
                                        <Link href={`/vote/${proposal.voteAccount}`}>
                                            Cast Vote <ArrowRight className="ml-2 h-5 w-5" />
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Closed Proposals Section */}
                    <section>
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--slate-blue)]/10 border border-[var(--slate-blue)]/30">
                                <Lock className="h-6 w-6 text-[var(--slate-blue)]" strokeWidth={2} />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-muted-foreground">Closed Proposals</h2>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {!loading && closedProposals.length === 0 && (
                                <div className="col-span-2">
                                    <EmptyState message="No closed proposals yet." />
                                </div>
                            )}
                            {closedProposals.map((proposal) => (
                                <div
                                    key={proposal.voteAccount}
                                    className="flex flex-col justify-between rounded-xl border border-[var(--slate-blue)]/20 bg-white/30 p-6 opacity-75"
                                >
                                    <div>
                                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--slate-blue)]/10 border border-[var(--slate-blue)]/30 px-3 py-1 text-xs font-semibold tracking-wide text-[var(--slate-blue)]">
                                            <Clock className="h-3 w-3" />
                                            Voting Closed
                                        </div>
                                        <h3 className="text-xl font-semibold leading-tight text-foreground">{proposal.title}</h3>
                                        <div className="mt-4 flex gap-6 text-sm font-medium">
                                            <div className="text-muted-foreground">For: <span className="text-[var(--sage-green)] font-semibold">{proposal.votesFor}</span></div>
                                            <div className="text-muted-foreground">Against: <span className="text-[var(--dusty-rose)] font-semibold">{proposal.votesAgainst}</span></div>
                                        </div>
                                    </div>
                                    <Button variant="secondary" asChild className="mt-6 h-12 w-full text-base border-dashed">
                                        <Link href={`/vote/${proposal.voteAccount}`}>
                                            View Receipt
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
