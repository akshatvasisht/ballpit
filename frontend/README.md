# Ballpit Frontend

This directory contains the user interface and frontend application for the Ballpit shareholder voting platform. It provides the dashboard for companies to manage vote proposals, and the interface for shareholders to securely cast their votes on-chain.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Blockchain Integration**: `@solana/wallet-adapter-react`, `@solana/web3.js`
- **Animation**: Framer Motion, GSAP, Three.js (for immersive 3D interactions)
- **Component System**: shadcn/ui (Radix Primitives)

## Core Features

1. **Shareholder Dashboard**: View available proposals, voting history, and tokenized share balances.
2. **On-Chain Voting**: Cryptographically sign transactions to cast verifiable, immutable votes using Solana wallets.
3. **Proxy Delegation**: Interface to delegate voting power to proxy wallets or revoke existing delegations.
4. **Company Admin Panel**: Tools to instantiate new VoteAccounts (ballots), mint share tokens, and monitor real-time vote tallies.
5. **Interactive Onboarding**: A comprehensive flow guiding users from off-chain KYC verification to claiming their on-chain share tokens.

## Getting Started

### Prerequisites
- Node.js 18+
- Backend API running locally (see root README and `docs/SETUP.md`)

### Installation

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

### Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000). Ensure your backend API is accessible for full functionality.

## Project Structure

- `src/app/`: Next.js App Router definitions, pages, and layouts.
- `src/components/`: Reusable React components organized by domain (UI primitives, landing page sections, etc.).
- `src/lib/`: Utility functions and shared helper logic.
- `public/`: Static assets such as images and fonts.

## Wallet Integration

The frontend utilizes the `@solana/wallet-adapter` suite to support multiple wallet providers (Phantom, Solflare, etc.). Users must install a supported browser extension to interact with the voting contracts.
