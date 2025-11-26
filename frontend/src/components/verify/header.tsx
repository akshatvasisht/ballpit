"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";

const steps = [
  { label: "Verify", number: 1 },
  { label: "Wallet", number: 2 },
  { label: "Confirm", number: 3 },
];

export function VerifyHeader() {
  const pathname = usePathname();

  // Derive active step from pathname base
  let activeStep = 1;
  if (pathname.startsWith("/confirm")) {
    activeStep = 3;
  } else if (pathname.startsWith("/wallet")) {
    activeStep = 2;
  }

  return (
    <header className="border-b-2 border-foreground bg-card">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-2">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Ballpit" width={119} height={64} className="h-16 w-auto object-contain" priority />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8">
          {steps.map((step, idx) => (
            <div key={step.number} className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-md border-2 border-foreground text-lg font-black shadow-[4px_4px_0_0_var(--shadow-color)] ${activeStep === step.number ? "bg-yellow" : "bg-card"
                  }`}
              >
                {step.number}
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide">{step.label}</span>
              {idx < steps.length - 1 && <div className="h-px w-6 bg-foreground" />}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
