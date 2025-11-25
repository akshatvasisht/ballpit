# BadgerBuild Architecture Documentation

This document provides detailed architectural documentation, design decisions, and a glossary of terms for the BadgerBuild blockchain-based shareholder voting system.

---

## Glossary of Terms

- **Tokenized Shares**: Digital representation of company shares minted as SPL tokens on Solana. Each token represents one voting unit and ownership stake.

- **KYC (Know Your Customer)**: Off-chain identity verification process that ensures only verified shareholders can receive tokenized shares and vote.

- **VoteAccount**: On-chain account (smart contract account) that stores vote proposal information, vote tallies, and voting status. Also referred to as the "Ballot Box."

- **VoteReceipt**: Program-derived address (PDA) that serves as proof a shareholder has voted on a specific proposal. Prevents double-voting.

- **Delegation**: Mechanism allowing token owners to delegate their voting rights to another address (delegate) who can vote on their behalf.

- **Delegation PDA**: Program-derived address storing delegation information, seeded by owner wallet and token mint.

- **Real Name Registry**: Off-chain database (lowdb) that maps wallet addresses to verified real names from KYC, enabling audit trails while maintaining on-chain privacy.

- **Authority Wallet**: Backend-controlled Solana wallet that mints tokens, creates votes, and manages company operations.

- **SPL Token**: Solana Program Library token standard used for tokenized shares.

- **Anchor Framework**: Development framework for Solana programs that provides type-safe interfaces and account management.

- **PDA (Program Derived Address)**: Deterministic address derived from seeds, allowing programs to control accounts without requiring a private key.

---

## Repository Structure

```
BadgerBuild/
├── backend/                        # Node.js/Express backend
│   ├── index.js                    # Main Express server and API endpoints
│   ├── kyc.js                      # Didit KYC integration service
│   ├── db.js                       # Real Name Registry database module (lowdb)
│   ├── idl.json                    # Anchor IDL for smart contract interface
│   ├── db.json                     # Local JSON database (auto-generated)
│   ├── package.json                # Backend dependencies
│   └── .env                        # Environment variables (not in git)
│
├── frontend/                       # Next.js 16 (React 19)
│   ├── src/
│   │   └── app/
│   │       ├── page.tsx            # Main user interface
│   │       ├── layout.tsx         # Root layout
│   │       └── globals.css         # Global styles
│   ├── public/                     # Static assets
│   ├── package.json                # Frontend dependencies
│   └── next.config.ts              # Next.js configuration
│
├── voting_contract/                # Solana smart contract (Anchor/Rust)
│   ├── programs/
│   │   └── voting-contract/
│   │       └── src/
│   │           └── lib.rs          # Main smart contract program
│   ├── tests/                      # Anchor test suite
│   ├── Anchor.toml                 # Anchor configuration
│   ├── Cargo.toml                  # Rust workspace configuration
│   └── target/                     # Build artifacts (not in git)
│       └── idl/
│           └── voting_contract.json # Generated IDL
│
├── docs/                           # Documentation directory
│   ├── ARCHITECTURE.md             # This file
│   ├── API.md                      # API reference
│   ├── TESTING.md                  # Testing guidelines
│   └── STYLE.md                    # Coding standards
│
├── README.md                       # Project overview
└── SETUP.md                        # Setup instructions
```

---

## Technology Stack

| **Category**           | **Technology**            | **Purpose**                                             | **Rationale**                                                                                 |
| ---------------------- | ------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Frontend Framework** | **Next.js 16**            | User interface (Dashboard, Voting Interface)           | App Router enables rapid development, SSR support, and optimized React 19 integration |
| **Styling**            | **Tailwind CSS**          | UI styling (Dark mode, responsive design)            | Rapid prototyping without custom CSS                                      |
| **Backend Framework**  | **Express.js**            | REST API server                                         | Lightweight, flexible, and well-suited for Solana integration                               |
| **Blockchain**         | **Solana**                | Smart contract platform                                 | High throughput, low fees, fast finality for governance applications                        |
| **Smart Contracts**    | **Anchor Framework**      | Solana program development                              | Type-safe interfaces, simplified account management, IDL generation                        |
| **Program Language**   | **Rust**                  | Smart contract implementation                           | Memory safety, performance, and Solana's native language                                   |
| **Token Standard**     | **SPL Token**             | Tokenized share representation                         | Standard Solana token format, compatible with wallets and exchanges                         |
| **KYC Service**        | **Didit API**             | Identity verification                                  | Off-chain KYC integration for compliance                                                  |
| **Database**           | **lowdb**                 | Real Name Registry (off-chain)                         | Lightweight JSON database for mapping wallets to verified names                            |
| **Blockchain SDK**     | **@solana/web3.js**       | Solana RPC interactions                                | Official Solana JavaScript SDK                                                              |
| **Anchor SDK**         | **@coral-xyz/anchor**     | Anchor program client                                  | Type-safe client for interacting with Anchor programs                                       |

---

## System Architecture

### High-Level Overview

BadgerBuild follows a three-tier architecture:

1. **Frontend Layer**: Next.js web application for user interaction
2. **Backend Layer**: Express.js API server handling business logic and Solana interactions
3. **Blockchain Layer**: Solana smart contracts for immutable vote recording

### Component Architecture

**Backend Server (`backend/index.js`):**
- Express.js application with REST API endpoints
- Manages Solana connection and Anchor program client
- Handles KYC verification workflow
- Mints tokenized shares to verified shareholders
- Creates and manages vote proposals
- Processes vote submissions and delegation

**KYC Service (`backend/kyc.js`):**
- Integrates with Didit API for identity verification
- Creates verification sessions
- Checks verification status
- Returns approval/decline status

**Real Name Registry (`backend/db.js`):**
- Stores wallet-to-name mappings using lowdb
- Links verified KYC sessions to wallet addresses
- Enables audit trails while maintaining on-chain privacy

**Smart Contract (`voting_contract/programs/voting-contract/src/lib.rs`):**
- `initialize_vote`: Creates new vote proposals
- `cast_vote`: Records shareholder votes
- `cast_proxy_vote`: Records proxy votes via delegation
- `set_delegate`: Establishes voting delegation
- `revoke_delegation`: Removes delegation
- `close_vote`: Closes voting and prevents new votes

**Frontend (`frontend/src/app/`):**
- User interface for shareholders to view and cast votes
- Company dashboard for creating proposals and viewing results
- Wallet connection integration (Phantom, Solflare, etc.)
- Real-time vote result display

---

## Data Flow

### Shareholder Onboarding Flow

1. **KYC Initiation**: Shareholder requests KYC verification via `/api/kyc/verify`
2. **Verification Session**: Backend creates Didit session and returns verification URL
3. **Identity Verification**: Shareholder completes KYC process through Didit interface
4. **Status Check**: Frontend polls `/api/kyc/status/:sessionId` for approval
5. **Share Claiming**: Upon approval, shareholder calls `/api/user/claim-share` with real name
6. **Token Minting**: Backend mints 1 share token to shareholder's wallet
7. **Registry Update**: Backend saves wallet-to-name mapping in Real Name Registry

### Vote Creation Flow

1. **Proposal Creation**: Company admin calls `/api/company/create-vote` with title
2. **Account Generation**: Backend generates new keypair for VoteAccount
3. **Smart Contract Call**: Backend calls `initialize_vote` instruction with title and token mint
4. **On-Chain Storage**: VoteAccount is created on Solana with initial state (active, zero votes)
5. **Proposal Available**: Vote appears in frontend for shareholders to view and vote

### Vote Casting Flow

1. **Vote Selection**: Shareholder selects vote and direction (for/against) in frontend
2. **Transaction Preparation**: Frontend calls `/api/user/cast-vote` to build transaction
3. **Wallet Signing**: Shareholder signs transaction with their Solana wallet
4. **Smart Contract Execution**: Transaction calls `cast_vote` instruction
5. **Validation**: Smart contract verifies:
   - Vote is active (`is_active == true`)
   - Voter has share tokens (`token_account.amount >= 1`)
   - Token mint matches vote's token mint
   - VoteReceipt PDA doesn't exist (prevents double-voting)
6. **Vote Recording**: VoteReceipt PDA is created, vote counts are incremented
7. **Result Update**: Frontend fetches updated vote results from blockchain

### Delegation Flow

1. **Delegation Setup**: Owner calls `/api/user/delegate` with delegate wallet address
2. **Transaction Building**: Backend builds `set_delegate` transaction
3. **Owner Signing**: Owner signs transaction to authorize delegation
4. **Delegation Record**: Delegation PDA is created/updated with owner, delegate, and mint
5. **Proxy Voting**: Delegate calls `/api/user/cast-proxy-vote` to vote on owner's behalf
6. **Validation**: Smart contract verifies delegation exists and delegate matches
7. **Vote Recording**: Vote is recorded with owner's token weight, VoteReceipt uses owner's key
8. **Revocation**: Owner can revoke delegation via `/api/user/revoke-delegate`

---

## Design Decisions

### Off-Chain KYC, On-Chain Voting

**Decision**: KYC verification is handled off-chain via Didit API, while voting occurs on-chain via Solana smart contracts.

**Rationale**:
- KYC requires sensitive personal information that shouldn't be stored on-chain
- Off-chain KYC allows integration with existing compliance providers
- On-chain voting provides immutability and transparency
- Real Name Registry bridges the gap for audit purposes while maintaining privacy

### Tokenized Shares as Voting Power

**Decision**: Each share token represents one voting unit, and vote weight equals token balance.

**Rationale**:
- Standard SPL tokens provide compatibility with Solana ecosystem
- Token balance automatically determines voting power
- Supports fractional ownership through token amounts
- Enables future features like token transfers and trading

### Program-Derived Addresses (PDAs) for VoteReceipts

**Decision**: VoteReceipts are PDAs seeded by vote account and voter address, preventing double-voting.

**Rationale**:
- PDAs are deterministic and cannot be created without program authority
- Seeding by vote and voter ensures uniqueness per vote-voter pair
- Prevents double-voting without requiring on-chain lookups
- Reduces storage costs compared to storing receipts in arrays

### Delegation via Separate PDA Accounts

**Decision**: Delegation records are stored in separate PDA accounts, allowing flexible proxy voting.

**Rationale**:
- Enables multi-level delegation chains
- Allows delegation revocation without affecting vote history
- Separates delegation logic from vote logic for clarity
- Supports future features like time-limited delegations

### Real Name Registry Off-Chain

**Decision**: Wallet-to-name mappings are stored in off-chain database (lowdb) rather than on-chain.

**Rationale**:
- Reduces on-chain storage costs
- Allows privacy-preserving on-chain voting
- Enables audit trails when needed (admin access)
- Simplifies GDPR compliance for personal data

### Express.js Backend Architecture

**Decision**: Backend uses Express.js with REST API endpoints rather than GraphQL or gRPC.

**Rationale**:
- Simple and familiar for Solana integration
- REST endpoints map cleanly to Solana transaction building
- Easy to integrate with frontend wallet libraries
- Sufficient for current feature set

### Anchor Framework for Smart Contracts

**Decision**: Smart contracts are built using Anchor framework rather than raw Solana programs.

**Rationale**:
- Type-safe interfaces reduce bugs
- IDL generation enables type-safe clients
- Simplified account management
- Better developer experience and faster iteration

### Single Authority Wallet Model

**Decision**: Backend uses a single authority wallet for token minting and vote creation.

**Rationale**:
- Simplifies initial implementation
- Centralized control for company operations
- Easy to extend to multi-signature later
- Reduces complexity for MVP

---

## Smart Contract Architecture

### Account Structures

**VoteAccount:**
- `authority`: Pubkey of vote creator (backend wallet)
- `is_active`: Boolean flag for voting status
- `title`: String proposal title
- `token_mint`: Pubkey of share token mint
- `votes_for`: u64 count of "for" votes
- `votes_against`: u64 count of "against" votes

**VoteReceipt:**
- `voter`: Pubkey of voter (owner in proxy votes)
- `vote_account`: Pubkey of VoteAccount
- `voted_for`: Boolean vote direction

**Delegation:**
- `owner`: Pubkey of token owner
- `delegate`: Pubkey of delegate
- `mint`: Pubkey of token mint

### Instruction Flow

**initialize_vote:**
1. Creates VoteAccount account
2. Sets initial values (active, zero votes)
3. Stores title and token mint reference

**cast_vote:**
1. Validates vote is active
2. Validates voter has tokens
3. Validates token mint matches
4. Creates VoteReceipt PDA (prevents double-voting)
5. Increments vote counts

**cast_proxy_vote:**
1. Validates vote is active
2. Validates delegation exists and matches
3. Validates owner has tokens
4. Creates VoteReceipt PDA using owner's key
5. Increments vote counts

**set_delegate:**
1. Creates/updates Delegation PDA
2. Stores owner, delegate, and mint

**revoke_delegation:**
1. Closes Delegation PDA account
2. Refunds rent to owner

**close_vote:**
1. Sets `is_active = false`
2. Prevents new votes (enforced in cast_vote)

---

## Security Considerations

### On-Chain Security

- **Double-Vote Prevention**: VoteReceipt PDAs ensure one vote per voter per proposal
- **Token Validation**: Vote instructions verify token ownership and mint matching
- **Active Vote Check**: Closed votes cannot accept new votes
- **Delegation Validation**: Proxy votes verify delegation exists and matches delegate

### Off-Chain Security

- **Admin Authentication**: Company endpoints require `x-admin-key` header
- **KYC Verification**: Share tokens only minted after KYC approval
- **Real Name Registry**: Admin-only access to wallet-to-name mappings
- **Environment Variables**: Sensitive keys stored in `.env` (not in git)

### Network Security

- **Permissioned Networks**: Supports permissioned Solana networks for enterprise use
- **Transaction Signing**: All on-chain operations require wallet signatures
- **Authority Control**: Backend authority wallet controls token minting and vote creation

---

## Scalability Considerations

### Current Limitations

- Single authority wallet model (can be extended to multi-sig)
- Off-chain database (lowdb) suitable for MVP, may need migration for scale
- No batching for token minting (can be optimized)

### Future Optimizations

- **Batch Minting**: Mint tokens to multiple shareholders in single transaction
- **Vote Sharding**: Partition votes across multiple programs for higher throughput
- **Database Migration**: Move Real Name Registry to PostgreSQL or similar for production
- **Caching Layer**: Add Redis for frequently accessed vote results
- **Load Balancing**: Multiple backend instances for high availability

