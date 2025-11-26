"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

/**
 * Global footer for the landing page.
 */
export function Footer() {
    return (
        <footer className="border-t border-border mt-16 bg-white/50 backdrop-blur-sm">
            <div className="container mx-auto px-6 py-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-2">
                        <Image src="/logo.png" alt="Ballpit" width={100} height={53} className="h-12 w-auto object-contain" />
                        <p className="text-xs text-muted-foreground">
                            Institutional-grade tokenized governance on Solana.
                        </p>
                    </div>

                    <div className="flex gap-8 text-sm text-muted-foreground">
                        <Link href="/docs" className="hover:text-[var(--electric-cyan)] transition-colors">Documentation</Link>
                        <a
                            href="https://github.com/ballpit"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[var(--electric-cyan)] transition-colors"
                        >
                            GitHub
                        </a>
                        <Link href="/admin?admin=true" className="hover:text-[var(--electric-cyan)] transition-colors">Admin Portal</Link>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        © 2026 Ballpit. Built for BadgerBuild Hackathon.
                    </p>
                </div>
            </div>
        </footer>
    );
}
