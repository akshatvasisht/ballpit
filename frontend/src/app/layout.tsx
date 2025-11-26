import type { Metadata } from "next";
import { Manrope, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { VerificationProvider } from "./providers/verifyProvider";
import { WalletProvider } from "./providers/solanaProvider";
import { Toaster } from "@/components/ui/sonner";
import { BlockchainFooter } from "@/components/blockchain-footer";

const cabinet = Manrope({
  variable: "--font-cabinet",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ballpit | Institutional Shareholder Governance",
  description: "A secure, blockchain-based platform for transparent shareholder voting and governance.",
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Ballpit | Institutional Shareholder Governance",
    description: "A secure, blockchain-based platform for transparent shareholder voting and governance.",
    images: [{ url: '/logo.png', width: 600, height: 150 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cabinet.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <WalletProvider>
          <VerificationProvider>
            <div className="flex-1">
              {children}
            </div>
            <BlockchainFooter />
            <Toaster />
          </VerificationProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
