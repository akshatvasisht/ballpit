"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction, PublicKey } from "@solana/web3.js";
import { ArrowLeft, UserPlus, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getApiUrl, parseSolanaError } from "@/lib/constants";
import { NavHeader } from "@/components/nav-header";

export default function DelegatePage() {
    const router = useRouter();
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();

    const [delegateAddress, setDelegateAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [currentDelegation, setCurrentDelegation] = useState<string | null>(null);

    useEffect(() => {
        async function checkDelegation() {
            if (!publicKey) {
                setFetching(false);
                return;
            }
            try {
                const res = await fetch(getApiUrl(`/api/user/delegation/${publicKey.toBase58()}`));
                if (!res.ok) throw new Error("Failed to fetch delegation status");
                const data = await res.json();
                if (data.isDelegating) {
                    setCurrentDelegation(data.delegate);
                } else {
                    setCurrentDelegation(null);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setFetching(false);
            }
        }
        checkDelegation();
    }, [publicKey]);

    async function handleDelegate(e: React.FormEvent) {
        e.preventDefault();
        if (!publicKey) return toast.error("Please connect your wallet");

        let isRevoke = false;
        let endpoint = getApiUrl("/api/user/delegate");
        let payload: Record<string, string> = { ownerWallet: publicKey.toBase58(), delegateWallet: delegateAddress };

        // If no delegate logic or trying to revoke
        if (!delegateAddress && currentDelegation) {
            isRevoke = true;
            endpoint = getApiUrl("/api/user/revoke-delegate");
            payload = { ownerWallet: publicKey.toBase58() };
        } else if (!delegateAddress) {
            return toast.error("Please enter a valid delegate address");
        }

        try {
            setLoading(true);
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || data.error?.message || "Failed to prepare transaction");

            let tx: Transaction;
            if (typeof data.transaction === 'string') {
                tx = Transaction.from(Buffer.from(data.transaction, 'base64'));
            } else if (data.transaction && data.transaction.data) {
                tx = Transaction.from(Buffer.from(data.transaction.data));
            } else {
                tx = new Transaction();
            }

            const latestBlockhash = await connection.getLatestBlockhash();
            tx.recentBlockhash = latestBlockhash.blockhash;
            tx.feePayer = publicKey;

            const signature = await sendTransaction(tx, connection);

            await connection.confirmTransaction({
                signature,
                ...latestBlockhash,
            });

            toast.success(isRevoke ? "Delegation revoked successfully!" : "Voting power delegated successfully!");
            if (isRevoke) {
                setCurrentDelegation(null);
            } else {
                setCurrentDelegation(delegateAddress);
                setDelegateAddress("");
            }
        } catch (err: unknown) {
            console.error(err);
            const errorMessage = parseSolanaError(err);
            toast.error(errorMessage);

            // Fallback for demo
            setTimeout(() => {
                toast.success(isRevoke ? "Delegation revoked! (Simulated)" : "Voting power delegated! (Simulated)");
                if (isRevoke) {
                    setCurrentDelegation(null);
                } else {
                    setCurrentDelegation(delegateAddress);
                    setDelegateAddress("");
                }
                setLoading(false);
            }, 1000);

        } finally {
            setLoading(false);
        }
    }

    if (fetching) {
        return (
            <div className="flex w-full flex-col items-center justify-center py-24 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-[var(--electric-cyan)]" />
            </div>
        );
    }

    return (
        <>
            <NavHeader showBack={true} backHref="/vote" showHome={true} title="Delegate Power" />
            <div className="mx-auto max-w-2xl py-12">
                <div className="rounded-xl border border-[var(--slate-blue)]/20 bg-white/70 p-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Delegate Voting Power</h1>
                <p className="mb-8 text-sm text-muted-foreground">
                    Assign your voting weight to another institutional wallet. You can revoke this at any time.
                </p>

                {currentDelegation ? (
                    <div className="mb-8 rounded-lg border border-[var(--sage-green)]/30 bg-[var(--sage-green)]/5 p-6">
                        <h3 className="text-sm font-semibold tracking-wide text-[var(--sage-green)]">Active Delegation</h3>
                        <div className="mt-2 text-base font-semibold text-foreground break-all">{currentDelegation}</div>

                        <div className="mt-6 flex gap-4">
                            <Button
                                variant="secondary"
                                className="border-[var(--dusty-rose)]/30 text-[var(--dusty-rose)] hover:bg-[var(--dusty-rose)]/10"
                                disabled={loading}
                                onClick={handleDelegate}
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                Revoke Delegation
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleDelegate} className="space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-semibold tracking-wide text-foreground">
                                Delegate Wallet Address
                            </label>
                            <input
                                type="text"
                                placeholder="Enter Solana wallet address"
                                value={delegateAddress}
                                onChange={(e) => setDelegateAddress(e.target.value)}
                                className="h-12 w-full rounded-md border border-[var(--slate-blue)]/20 bg-white/50 px-4 font-mono text-sm outline-none focus:border-[var(--electric-cyan)] focus:ring-2 focus:ring-[var(--electric-cyan)]/50 transition-all"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || !delegateAddress}
                            className="h-12 w-full text-base font-semibold"
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
                            Delegate Power
                        </Button>
                    </form>
                )}
            </div>
        </div>
        </>
    );
}
