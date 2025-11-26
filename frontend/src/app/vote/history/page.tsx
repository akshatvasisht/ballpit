"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowLeft, Clock, Vote, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getExplorerUrl } from "@/lib/constants";
import { NavHeader } from "@/components/nav-header";

interface HistoryEvent {
    id: string;
    proposalTitle: string;
    date: string;
    action: string;
    signature: string;
}

export default function HistoryPage() {
    const { publicKey } = useWallet();
    const [history, setHistory] = useState<HistoryEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate fetching history from backend/RPC
        async function fetchHistory() {
            if (!publicKey) {
                setLoading(false);
                return;
            }

            try {
                // Mock data for demo purposes since there's no direct backend history endpoint
                setTimeout(() => {
                    setHistory([
                        {
                            id: "1",
                            proposalTitle: "Ratify Corporate Restructuring",
                            date: "Oct 12, 2023",
                            action: "Voted FOR",
                            signature: "5xyz...abcd",
                        },
                        {
                            id: "2",
                            proposalTitle: "Q3 Financial Budget",
                            date: "Oct 15, 2023",
                            action: "Delegated Power to 9abc...def",
                            signature: "3abc...def1",
                        },
                        {
                            id: "3",
                            proposalTitle: "Elect New Board Director",
                            date: "Oct 18, 2023",
                            action: "Voted AGAINST",
                            signature: "8def...abc2",
                        }
                    ]);
                    setLoading(false);
                }, 800);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load history.");
                setLoading(false);
            }
        }

        fetchHistory();
    }, [publicKey]);

    return (
        <>
            <NavHeader showBack={true} backHref="/vote" showHome={true} title="Voting History" />
            <div className="mx-auto max-w-4xl py-12">
                <div className="rounded-xl border border-[var(--slate-blue)]/20 bg-white/70 p-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Voting History</h1>
                <p className="mb-8 text-sm text-muted-foreground">
                    Review your past governance actions and on-chain receipts.
                </p>

                {!publicKey ? (
                    <div className="py-12 text-center text-sm font-semibold text-[var(--dusty-rose)]">
                        Please connect your wallet to view history.
                    </div>
                ) : loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-[var(--electric-cyan)]" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="py-12 text-center text-sm font-semibold text-muted-foreground">
                        No history found.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-lg border border-[var(--slate-blue)]/20 bg-white/50">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-[var(--slate-blue)]/20 bg-[var(--slate-blue)]/5">
                                <tr>
                                    <th className="px-6 py-4 font-semibold tracking-wide text-foreground">Date</th>
                                    <th className="px-6 py-4 font-semibold tracking-wide text-foreground">Proposal / Event</th>
                                    <th className="px-6 py-4 font-semibold tracking-wide text-foreground">Action</th>
                                    <th className="px-6 py-4 font-semibold tracking-wide text-foreground text-right">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--slate-blue)]/10">
                                {history.map((item) => (
                                    <tr key={item.id} className="transition-colors hover:bg-white/80">
                                        <td className="whitespace-nowrap px-6 py-4 font-medium text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" /> {item.date}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-foreground max-w-[200px] truncate">
                                            {item.proposalTitle}
                                        </td>
                                        <td className="px-6 py-4 font-semibold">
                                            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${item.action.includes("FOR") ? "bg-[var(--sage-green)]/10 border-[var(--sage-green)]/30 text-[var(--sage-green)]" :
                                                    item.action.includes("AGAINST") ? "bg-[var(--dusty-rose)]/10 border-[var(--dusty-rose)]/30 text-[var(--dusty-rose)]" : "bg-[var(--warm-amber)]/10 border-[var(--warm-amber)]/30 text-[var(--warm-amber)]"
                                                }`}>
                                                <Vote className="h-3 w-3" />
                                                {item.action}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <a
                                                href={getExplorerUrl('tx', item.signature)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-mono text-xs text-[var(--electric-cyan)] hover:underline"
                                            >
                                                {item.signature}
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
        </>
    );
}
