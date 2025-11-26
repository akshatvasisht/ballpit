/* Client-side verify step: collect personal info and move to documents. */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { useVerification } from "../providers/verifyProvider";
import { NavHeader } from "@/components/nav-header";

export default function VerifyPage() {
  const router = useRouter();
  const { setStage, setStatus, setPersonalInfo, submitInfo } = useVerification();
  const [loading, setLoading] = useState(false);

  // Hidden Developer Bypass (Shift + D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setStatus("success");
        router.push("/vote");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, setStatus]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: (formData.get("fullName") as string) || "",
      email: (formData.get("email") as string) || "",
      dob: (formData.get("dob") as string) || "",
      address: (formData.get("address") as string) || "",
    };

    try {
      setLoading(true);
      setStatus("in_progress");
      setStage("documents");
      setPersonalInfo(payload);
      await submitInfo({ personalInfo: payload });
      setStatus("success");
      router.push("/verify/documents");
    } catch (err) {
      console.error("Submit verification info failed", err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <NavHeader showBack={true} backHref="/" showHome={true} title="KYC Verification" />
      <div className="flex w-full flex-col items-center gap-8 py-12">
        <Card className="w-full max-w-2xl">
          <CardContent className="space-y-6 px-8 py-10">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--sage-green)]/10 border border-[var(--sage-green)]/30">
            <ClipboardList className="h-7 w-7 text-[var(--sage-green)]" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Institutional KYC Portal
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Provide corporate signatory details to verify identity
            </p>
          </div>
        </div>

        <form className="space-y-5 mt-8" onSubmit={handleSubmit}>
          <Field label="Signatory full legal name">
            <input
              className="h-11 w-full rounded-md border border-[var(--slate-blue)]/20 bg-white/50 px-4 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--electric-cyan)]/50 focus:border-[var(--electric-cyan)] transition-all"
              placeholder="John Smith"
              type="text"
              name="fullName"
            />
          </Field>

          <Field label="Email address">
            <input
              className="h-11 w-full rounded-md border border-[var(--slate-blue)]/20 bg-white/50 px-4 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--electric-cyan)]/50 focus:border-[var(--electric-cyan)] transition-all"
              placeholder="john@company.com"
              type="email"
              name="email"
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Date of birth">
              <input
                className="h-11 w-full rounded-md border border-[var(--slate-blue)]/20 bg-white/50 px-4 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--electric-cyan)]/50 focus:border-[var(--electric-cyan)] transition-all"
                placeholder="mm/dd/yyyy"
                type="text"
                name="dob"
              />
            </Field>
            <Field label="Residential address">
              <input
                className="h-11 w-full rounded-md border border-[var(--slate-blue)]/20 bg-white/50 px-4 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--electric-cyan)]/50 focus:border-[var(--electric-cyan)] transition-all"
                placeholder="123 Main St, City, State"
                type="text"
                name="address"
              />
            </Field>
          </div>

          <div className="grid gap-4 pt-4">
            <Button type="submit" size="lg" loading={loading} className="h-12 w-full text-base">
              Continue <ArrowRight className="h-5 w-5" />
            </Button>

            <div className="relative py-2 hidden">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted-foreground/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-bold">Demo Only</span>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
      </div>
    </>
  );
}
