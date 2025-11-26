"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "./ui/button";

interface NavHeaderProps {
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
  title?: string;
  showHome?: boolean;
}

export function NavHeader({
  showBack = false,
  backHref = "/",
  backLabel = "Back",
  title,
  showHome = true,
}: NavHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--slate-blue)]/10">
      <div className="container mx-auto px-6 py-1">
        <div className="flex items-center justify-between">
          {/* Logo / Home Link */}
          {showHome && (
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Image src="/logo.png" alt="Ballpit" width={119} height={64} className="h-16 w-auto object-contain" priority />
            </Link>
          )}

          {/* Page Title */}
          {title && !showHome && (
            <h1 className="text-lg font-semibold">{title}</h1>
          )}

          {/* Back Button */}
          <div className="ml-auto">
            {showBack && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={backHref}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {backLabel}
                </Link>
              </Button>
            )}
            {!showBack && showHome && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <Home className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
