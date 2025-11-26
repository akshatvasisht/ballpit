"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Building2, Coins, CircleCheck, Wallet, ShieldCheck } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

import { Button } from "@/components/ui/button";
import { useVerification } from "../providers/verifyProvider";
import { NavHeader } from "@/components/nav-header";

// Use the exact share token mint from backend
const SHARE_TOKEN_MINT = new PublicKey("4tbkoExLHa9j62vCshizth9HdQjvyDpSeMnto2DmnMh7");

export default function ConfirmPage() {
  const steps = [
    {
      icon: CircleCheck,
      title: "Identity Verified",
      subtitle: "KYC complete",
    },
    {
      icon: Wallet,
      title: "Wallet Connected",
      subtitle: "Secure custody",
    },
    {
      icon: ShieldCheck,
      title: "Shares Tokenized",
      subtitle: "Ready to vote",
    },
  ];
  const router = useRouter();
  const { personalInfo } = useVerification();
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    async function fetchBalance() {
      if (!publicKey) return;
      setLoadingBalance(true);
      try {
        const ata = await getAssociatedTokenAddress(SHARE_TOKEN_MINT, publicKey);
        const accountInfo = await connection.getTokenAccountBalance(ata);
        setBalance(accountInfo.value.uiAmount);
      } catch (err) {
        console.error("No token account found or error fetching balance:", err);
        setBalance(0);
      } finally {
        setLoadingBalance(false);
      }
    }
    fetchBalance();
  }, [publicKey, connection]);

  const fullName = personalInfo?.fullName || "John Doe (Verified)";
  const walletStr = publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : "Not Connected";
  const shareStr = loadingBalance
    ? "..."
    : balance !== null
      ? `${balance} tokens`
      : "1,250 tokens (mock)";

  const summaryCards = [
    {
      icon: Building2,
      label: "Verified Identity",
      value: fullName,
      color: "dusty-rose",
    },
    {
      icon: Wallet,
      label: "Wallet Address",
      value: walletStr,
      color: "electric-cyan",
    },
    {
      icon: ShieldCheck,
      label: "Shares Owned",
      value: shareStr,
      color: "warm-amber",
    },
    {
      icon: Coins,
      label: "Voting Weight",
      value: "1 Vote / Share",
      color: "sage-green",
    },
  ];

  return (
    <>
      <NavHeader showBack={true} backHref="/wallet" showHome={true} title="Setup Complete" />
      <div className="flex w-full flex-col items-center gap-8 text-center py-12">
        <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-lg bg-[var(--sage-green)]/10 border border-[var(--sage-green)]/30">
          <CircleCheck className="h-10 w-10 text-[var(--sage-green)]" strokeWidth={2} />
        </div>

        <div>
          <h1 className="text-4xl font-bold tracking-tight">You&apos;re all set!</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Review your share allocation and voting power
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-6">
        <div className="grid gap-4 rounded-xl border border-[var(--slate-blue)]/20 bg-white/50 p-6 md:grid-cols-2">
          {summaryCards.map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-lg border border-[var(--slate-blue)]/20 bg-white px-4 py-4"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--${color})]/10 border border-[var(--${color})]/30`}>
                <Icon className={`h-5 w-5 text-[var(--${color})]`} strokeWidth={2} />
              </div>
              <div className="text-left flex-1">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="text-base font-semibold leading-tight truncate max-w-[200px]">{value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-[var(--slate-blue)]/20 bg-white/50 p-5 text-left">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Check className="h-4 w-4 text-[var(--sage-green)]" strokeWidth={2} />
            How voting power works
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Your shares determine your voting power. Each share equals one vote. The more shares you hold,
            the greater your influence on governance decisions.
          </p>
        </div>

        <div className="grid gap-6 rounded-xl border border-[var(--slate-blue)]/20 bg-white/50 px-6 py-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, subtitle }) => (
            <div key={title} className="space-y-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--sage-green)]/10 border border-[var(--sage-green)]/30">
                <Icon className="h-6 w-6 text-[var(--sage-green)]" strokeWidth={2} />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold tracking-tight">{title}</div>
                <div className="text-xs text-muted-foreground">{subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-3xl">
        <Button
          className="h-12 w-full text-base"
          onClick={() => router.push('/vote')}
        >
          Continue to dashboard <Check className="h-5 w-5" />
        </Button>
      </div>

      <div className="text-sm font-medium text-muted-foreground">
        You can now participate in upcoming governance votes
      </div>
    </div>
    </>
  );
}
