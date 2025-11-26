import Link from "next/link";
import { CircleCheck, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NavHeader } from "@/components/nav-header";

export default function VerificationSuccessPage() {
  return (
    <>
      <NavHeader showBack={true} backHref="/verify" showHome={true} title="Verification Complete" />
      <div className="flex w-full flex-col items-center gap-8 py-12">
        <Card className="w-full max-w-2xl bg-card shadow-[12px_12px_0_0_var(--shadow-color)]">
          <CardContent className="space-y-8 px-8 py-10 text-center">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-md border-2 border-foreground bg-green shadow-[4px_4px_0_0_var(--shadow-color)]">
            <CircleCheck className="h-8 w-8" strokeWidth={2.5} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-tight">Verified!</h1>
          <p className="text-sm text-muted-foreground">
            Your identity has been successfully verified
          </p>
        </div>

        <div>
          <Button asChild size="lg" className="h-12 w-full rounded-[14px] text-base">
            <Link href="/wallet">
              Continue to wallet setup <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
      </div>
    </>
  );
}
