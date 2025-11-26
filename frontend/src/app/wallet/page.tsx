"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useVerification } from '../providers/verifyProvider';
import { NavHeader } from '@/components/nav-header';

const wallets = [
  { name: 'Phantom', color: 'bg-[linear-gradient(135deg,#7d00ff,#b10eff)]' },
  { name: 'Solflare', color: 'bg-[linear-gradient(135deg,#00c16e,#00e6a6)]' },
  { name: 'Backpack', color: 'bg-[linear-gradient(135deg,#ff3d00,#ff9a00)]' },
  { name: 'Ledger', color: 'bg-[linear-gradient(135deg,#0c1325,#1c2d55)]' },
];

export default function WalletPage() {
  const router = useRouter();
  const { setWallet } = useVerification();

  const handleWalletSelect = (walletName: string) => {
    setWallet({ wallet: walletName, address: "0x1234...ABCD" }); // Dummy address for now
    router.push('/confirm');
  };
  return (
    <>
      <NavHeader showBack={true} backHref="/verify/success" showHome={true} title="Wallet Connection" />
      <div className="flex w-full flex-col items-center gap-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Asset Registry Linking
          </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Verify Ownership of Institutional Share Tokens
        </p>
      </div>

      <Card className="w-full max-w-3xl">
        <CardContent className="space-y-3 px-8 py-8">
          <div className="space-y-3">
            {wallets.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => handleWalletSelect(wallet.name)}
                className="flex h-16 w-full items-center justify-between rounded-lg border border-[var(--slate-blue)]/20 bg-white/50 px-5 text-left transition-all hover:border-[var(--electric-cyan)]/50 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--electric-cyan)]/50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${wallet.color}`}
                  />
                  <span className="text-base font-semibold">{wallet.name}</span>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" strokeWidth={2} />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="w-full max-w-3xl">
        <div className="flex items-start gap-3 rounded-lg border border-[var(--warm-amber)]/30 bg-[var(--warm-amber)]/5 px-5 py-4">
          <div className="mt-0.5">
            <AlertCircle className="h-5 w-5 text-[var(--warm-amber)]" strokeWidth={2} />
          </div>
          <div className="space-y-1 text-sm">
            <div className="font-semibold text-foreground">
              Your wallet holds tokenized shares representing your voting power.
            </div>
            <p className="text-muted-foreground">
              These digital tokens are tied to your real-world shares and
              determine your influence in governance decisions.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-3xl">
        <Button
          className="h-12 w-full text-base"
          variant="default"
          onClick={() => router.push('/confirm')}
        >
          Finish Setup <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
    </>
  );
}
