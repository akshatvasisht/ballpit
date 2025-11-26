"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ThumbsUp, ThumbsDown, Users, FileText, Loader2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/constants";
import { NavHeader } from "@/components/nav-header";

function AdminDashboardContent() {
    const searchParams = useSearchParams();
    const isAdmin = searchParams.get("admin") === "true";

    const [activeTab, setActiveTab] = useState<"analytics" | "audit" | "create">("analytics");
    const [loading, setLoading] = useState(false);

    // Analytics State
    interface VoteRow { voteAccount: string; title: string; isActive: boolean; votesFor: string; votesAgainst: string; participationRate: string; }
    const [votes, setVotes] = useState<VoteRow[]>([]);
    const [totalShareholders, setTotalShareholders] = useState(0);

    // Audit State
    interface Shareholder { realName: string; walletAddress: string; sessionId?: string; }
    const [shareholders, setShareholders] = useState<Shareholder[]>([]);

    // Create Proposal State
    const [newTitle, setNewTitle] = useState("");
    const [creating, setCreating] = useState(false);

    // For the hackathon demo, we use NEXT_PUBLIC_ADMIN_KEY from the frontend .env
    // with a fallback to "password" which matches the default backend configuration.
    const ADMIN_HEADER = { "x-admin-key": process.env.NEXT_PUBLIC_ADMIN_KEY ?? "password" };

    useEffect(() => {
        if (!isAdmin) return;
        if (activeTab === "analytics") fetchAnalytics();
        if (activeTab === "audit") fetchShareholders();
    }, [isAdmin, activeTab]);

    async function fetchAnalytics() {
        try {
            setLoading(true);
            const res = await fetch(getApiUrl("/api/company/votes"), {
                headers: ADMIN_HEADER
            });
            if (!res.ok) throw new Error("Failed to fetch votes analytics");
            const data = await res.json();
            setVotes(data.votes || []);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Could not load analytics";
            console.error(err);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    async function fetchShareholders() {
        try {
            setLoading(true);
            const res = await fetch(getApiUrl("/api/company/shareholders"), {
                headers: ADMIN_HEADER
            });
            if (!res.ok) throw new Error("Failed to fetch shareholders limit or auth blocked.");
            const data = await res.json();
            setShareholders(data.shareholders || []);
            setTotalShareholders(data.shareholders?.length || 0);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Could not load shareholders";
            console.error(err);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateProposal(e: React.FormEvent) {
        e.preventDefault();
        if (!newTitle) return;
        try {
            setCreating(true);
            const res = await fetch(getApiUrl("/api/company/create-vote"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...ADMIN_HEADER
                },
                body: JSON.stringify({ title: newTitle }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Creation failed");
            toast.success("Proposal Created: " + newTitle);
            setNewTitle("");
            setActiveTab("analytics");
            fetchAnalytics();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to create proposal";
            console.error(err);
            toast.error(msg);
        } finally {
            setCreating(false);
        }
    }

    if (!isAdmin) {
        return (
            <div className="flex w-full flex-col items-center justify-center py-32 text-center">
                <h1 className="text-4xl font-bold tracking-tight mb-4 text-[var(--dusty-rose)]">Unauthorized</h1>
                <p className="font-medium text-muted-foreground">Admin Access Required</p>
            </div>
        );
    }

    return (
        <>
            <NavHeader showBack={true} backHref="/" showHome={true} title="Admin Console" />
            <div className="mx-auto max-w-5xl py-12">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold tracking-tight">Admin Console</h1>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Company Governance Controls
                    </p>
                </div>

                <div className="mb-8 flex flex-wrap gap-4 justify-center">
                    <Button
                        variant={activeTab === "analytics" ? "default" : "secondary"}
                        onClick={() => setActiveTab("analytics")}
                    >
                        <FileText className="mr-2 h-4 w-4" /> Real-Time Analytics
                    </Button>
                    <Button
                        variant={activeTab === "create" ? "default" : "secondary"}
                        onClick={() => setActiveTab("create")}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Create Proposal
                    </Button>
                    <Button
                        variant={activeTab === "audit" ? "default" : "secondary"}
                        onClick={() => setActiveTab("audit")}
                    >
                        <Users className="mr-2 h-4 w-4" /> Shareholder Audit
                    </Button>
                </div>

                <div className="rounded-xl border border-[var(--slate-blue)]/20 bg-white/70 p-8 min-h-[400px]">
                    {loading && (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-[var(--electric-cyan)]" />
                        </div>
                    )}

                    {!loading && activeTab === "analytics" && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold tracking-tight">Active & Past Proposals</h2>
                                <Button size="icon" variant="secondary" onClick={fetchAnalytics}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid gap-6">
                                {votes.length === 0 ? (
                                    <div className="text-center py-10 font-semibold text-muted-foreground">No proposals found</div>
                                ) : (
                                    votes.map((vote) => (
                                        <div key={vote.voteAccount} className="rounded-lg border border-[var(--slate-blue)]/20 bg-white/50 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div>
                                                <div className={`mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${vote.isActive ? "bg-[var(--sage-green)]/10 border-[var(--sage-green)]/30 text-[var(--sage-green)]" : "bg-[var(--slate-blue)]/10 border-[var(--slate-blue)]/30 text-[var(--slate-blue)]"}`}>
                                                    {vote.isActive ? "LIVE" : "CLOSED"}
                                                </div>
                                                <h3 className="text-xl font-semibold text-foreground">{vote.title}</h3>
                                                <div className="text-xs text-muted-foreground mt-1 font-mono">{vote.voteAccount}</div>
                                            </div>

                                            <div className="flex gap-8 text-sm font-semibold bg-white p-4 rounded-lg border border-[var(--slate-blue)]/20">
                                                <div className="text-center">
                                                    <div className="text-[var(--sage-green)] flex items-center gap-1 justify-center"><ThumbsUp className="h-3 w-3" /> FOR</div>
                                                    <div className="text-lg text-foreground">{vote.votesFor}</div>
                                                </div>
                                                <div className="text-center border-l border-[var(--slate-blue)]/20 pl-8">
                                                    <div className="text-[var(--dusty-rose)] flex items-center gap-1 justify-center"><ThumbsDown className="h-3 w-3" /> AGAINST</div>
                                                    <div className="text-lg text-foreground">{vote.votesAgainst}</div>
                                                </div>
                                                <div className="text-center border-l border-[var(--slate-blue)]/20 pl-8">
                                                    <div className="text-[var(--electric-cyan)] flex items-center gap-1 justify-center">RATE</div>
                                                    <div className="text-lg text-foreground">{vote.participationRate}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {!loading && activeTab === "create" && (
                        <div className="max-w-md mx-auto py-8">
                            <h2 className="text-2xl font-bold tracking-tight mb-6 text-center">New Ballot Box</h2>
                            <form onSubmit={handleCreateProposal} className="space-y-6">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold tracking-wide text-foreground">
                                        Proposal Title
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Approve Q4 Marketing Budget"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        className="h-12 w-full rounded-md border border-[var(--slate-blue)]/20 bg-white/50 px-4 font-medium text-sm outline-none focus:border-[var(--electric-cyan)] focus:ring-2 focus:ring-[var(--electric-cyan)]/50 transition-all"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={creating}
                                    className="h-12 w-full text-base font-semibold"
                                >
                                    {creating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
                                    Publish On-Chain Proposal
                                </Button>
                            </form>
                        </div>
                    )}

                    {!loading && activeTab === "audit" && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold tracking-tight">Shareholder Audit View</h2>
                                <Button size="icon" variant="secondary" onClick={fetchShareholders}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="rounded-lg border border-[var(--warm-amber)]/30 bg-[var(--warm-amber)]/5 p-4 mb-6 text-sm font-semibold text-foreground">
                                Total Verified Shareholders: {totalShareholders}
                            </div>

                            <div className="overflow-hidden rounded-lg border border-[var(--slate-blue)]/20 bg-white/50">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-[var(--slate-blue)]/20 bg-[var(--slate-blue)]/5">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold tracking-wide text-foreground">KYC Name</th>
                                            <th className="px-6 py-4 font-semibold tracking-wide text-foreground">Wallet Address</th>
                                            <th className="px-6 py-4 font-semibold tracking-wide text-foreground text-right">KYC Session</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--slate-blue)]/10">
                                        {shareholders.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-8 text-center font-semibold text-muted-foreground">
                                                    No shareholders found.
                                                </td>
                                            </tr>
                                        ) : (
                                            shareholders.map((sh, idx) => (
                                                <tr key={idx} className="transition-colors hover:bg-white/80">
                                                    <td className="px-6 py-4 font-semibold text-foreground">{sh.realName}</td>
                                                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{sh.walletAddress}</td>
                                                    <td className="px-6 py-4 font-mono text-xs text-right text-muted-foreground">{sh.sessionId || "Legacy"}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin opacity-50" /></div>}>
            <AdminDashboardContent />
        </Suspense>
    )
}
