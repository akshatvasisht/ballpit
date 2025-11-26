"use client";

import React, { useMemo } from "react";
import {
    ConnectionProvider,
    WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";

export function WalletProvider({ children }: { children: React.ReactNode }) {
    // Use devnet or mainnet-beta based on your environment
    const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <SolanaWalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </SolanaWalletProvider>
        </ConnectionProvider>
    );
}
