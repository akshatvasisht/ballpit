import type { ReactNode } from "react";

import { VerifyHeader } from "@/components/verify/header";

export default function VerifyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <VerifyHeader />
      <main className="mx-auto flex min-h-[calc(100vh-150px)] max-w-4xl items-center justify-center px-6 py-12">
        {children}
      </main>
    </div>
  );
}
