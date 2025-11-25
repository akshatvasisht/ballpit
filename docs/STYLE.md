# Project Style Guide & Coding Standards

This document serves as the authoritative source for coding standards, documentation styles, and architectural context for the **BadgerBuild** project. It is intended to be referenced by developers and AI assistants to ensure consistency, professionalism, and maintainability across the codebase.

## 1. General Principles

### 1.1 Professionalism
* **Tone:** All documentation and comments must be written in a professional, objective, and technical tone.
* **Language:** Avoid informal language, slang, or "hackathon" jargon (e.g., "hacked together," "dirty fix").
* **Constraint Descriptions:** Describe technical constraints rather than environmental ones.
    * *Incorrect:* "Running on my hackathon laptop."
    * *Correct:* "Defaulting to devnet for development and testing."

### 1.2 Intent over Implementation
* **Why, Not What:** Comments should explain *why* a decision was made or *how* an interface is intended to be used. Do not narrate the code execution logic step-by-step, as the code itself should be self-explanatory.
* **No Meta-Commentary:** Do not leave "thinking traces," internal debates, or editing notes in the codebase.
    * *Forbidden:* `// I tried X but it failed, so I'm doing Y...`
    * *Allowed:* `// Uses PDA to prevent double-voting without requiring on-chain lookups.`

---

## 2. Frontend Guidelines (TypeScript / React / Next.js)

### 2.1 Code Style
* **Components:** Use functional components with strictly typed interfaces for props.
* **Strict Typing:** Avoid `any`. Define shared types in `frontend/src/types/` to ensure consistency between frontend and backend.
* **Hooks:** Abstract complex logic into custom hooks (e.g., `useSolanaWallet.ts`) to keep UI components focused on rendering.
* **Async/Await:** Prefer async/await over promise chains for readability.

### 2.2 Documentation Standards
* **JSDoc:** Use standard JSDoc format (`/** ... */`) for exported functions, hooks, and complex component props.
* **Prop Documentation:** Explicitly document specific behaviors of props if the name is not self-explanatory.
* **Clean Handlers:** Event handlers should contain logic or calls to handlers, not paragraphs of developer reasoning.

**Example:**
```typescript
/**
 * Vote card component displaying proposal information and voting controls.
 * Handles wallet connection and transaction signing for vote submission.
 */
export default function VoteCard({
  voteAccount,
  title,
  isActive,
  onVote,
}: VoteCardProps) {
  // ... implementation
}
```

### 2.3 TypeScript Best Practices
* **Type Definitions:** Define types in separate files (`types/voting.ts`, `types/wallet.ts`)
* **Interface vs Type:** Use `interface` for object shapes, `type` for unions and intersections
* **Optional Properties:** Mark optional properties with `?` and provide defaults when appropriate

**Example:**
```typescript
interface VoteCardProps {
  voteAccount: string;
  title: string;
  isActive: boolean;
  onVote?: (direction: boolean) => Promise<void>;
}
```

---

## 3. Backend Guidelines (Node.js / Express)

### 3.1 Code Style
* **Modules:** Use CommonJS (`require`/`module.exports`) or ES modules consistently throughout the project.
* **Async/Await:** Prefer async/await over callbacks for asynchronous operations.
* **Error Handling:** Use try-catch blocks for error handling, return appropriate HTTP status codes.
* **Environment Variables:** Access environment variables via `process.env`, validate required variables on startup.

### 3.2 Documentation Standards
* **JSDoc Comments:** Use JSDoc format for exported functions and complex logic.
* **Route Documentation:** Document each route with purpose, request/response formats, and status codes.
* **Function Documentation:** Clearly describe parameters, return values, and potential errors.

**Bad Example:**
```javascript
function mintToken(wallet, amount) {
    // Steps:
    // 1. Get token account
    // 2. Mint tokens
    // 3. Return result
}
```

**Good Example:**
```javascript
/**
 * Mints share tokens to a verified shareholder's wallet.
 * 
 * @param {string} walletAddress - The shareholder's Solana wallet address
 * @param {number} amount - Number of tokens to mint (default: 1)
 * @returns {Promise<{tokenAccount: string, amount: number}>} Token account address and minted amount
 * @throws {Error} If wallet address is invalid or minting fails
 */
async function mintToken(walletAddress, amount = 1) {
    // Implementation
}
```

### 3.3 Express Best Practices
* **Route Organization:** Group related routes by feature (KYC, company, user, delegation)
* **Middleware:** Use middleware for authentication, validation, and error handling
* **Response Format:** Return consistent JSON response format with `message`, `error`, or data fields
* **Status Codes:** Use appropriate HTTP status codes (200, 400, 403, 500)

**Example:**
```javascript
app.post("/api/user/cast-vote", async (req, res) => {
  try {
    const { voteAccount, voteDirection, voterWallet } = req.body;
    
    if (!voteAccount || voteDirection === undefined || !voterWallet) {
      return res.status(400).json({
        error: "voteAccount, voteDirection, and voterWallet are required"
      });
    }
    
    // ... implementation
    
    res.json({
      message: "Transaction prepared. User must sign from frontend.",
      transaction: tx,
      voteReceipt: voteReceipt.toBase58(),
    });
  } catch (error) {
    console.error("Failed to cast vote:", error);
    res.status(500).json({ 
      error: "Failed to cast vote", 
      details: error.message 
    });
  }
});
```

---

## 4. Smart Contract Guidelines (Rust / Anchor)

### 4.1 Code Style
* **Naming:** Use `snake_case` for functions and variables, `PascalCase` for structs and enums.
* **Documentation:** Use `///` for doc comments on public items, `//` for inline comments.
* **Error Handling:** Use Anchor's `Result<T>` type and custom error codes for error handling.
* **Account Validation:** Use Anchor constraints (`#[account(...)]`) for account validation.

### 4.2 Documentation Standards
* **Doc Comments:** Use triple-slash doc comments (`///`) for public functions and structs.
* **Instruction Documentation:** Document each instruction with purpose, accounts required, and error conditions.
* **Account Documentation:** Document account structures with field descriptions and constraints.

**Bad Example:**
```rust
pub fn cast_vote(ctx: Context<CastVote>, vote_direction: bool) -> Result<()> {
    // Steps:
    // 1. Check if vote is active
    // 2. Check if voter has tokens
    // 3. Record the vote
}
```

**Good Example:**
```rust
/// Casts a vote on a proposal.
/// 
/// Validates that the vote is active, the voter has sufficient tokens,
/// and the token mint matches the vote's token mint. Creates a VoteReceipt
/// PDA to prevent double-voting.
/// 
/// # Arguments
/// * `ctx` - Context containing vote account, voter, and token accounts
/// * `vote_direction` - `true` for "for", `false` for "against"
/// 
/// # Errors
/// * `VoteIsClosed` - Vote is no longer accepting votes
/// * `InvalidTokenMint` - Token mint doesn't match vote's token mint
/// * `NotEnoughTokens` - Voter doesn't have sufficient tokens
pub fn cast_vote(ctx: Context<CastVote>, vote_direction: bool) -> Result<()> {
    // Implementation
}
```

### 4.3 Anchor Best Practices
* **Account Constraints:** Use Anchor constraints for validation (`has_one`, `mut`, `signer`, etc.)
* **PDA Derivation:** Use `findProgramAddressSync` for deterministic PDA derivation
* **Error Codes:** Define custom error codes in `#[error_code]` enum
* **Space Calculation:** Document space calculations for account initialization

**Example:**
```rust
#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub vote_account: Account<'info, VoteAccount>,
    
    #[account(
        init,
        payer = voter,
        space = 8 + 32 + 32 + 1, // 8 (discriminator) + 32 (voter) + 32 (vote_account) + 1 (voted_for)
        seeds = [b"receipt", vote_account.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_receipt: Account<'info, VoteReceipt>,
    
    #[account(mut)]
    pub voter: Signer<'info>,
    
    #[account(
        mut,
        constraint = voter_token_account.owner == voter.key(),
        constraint = voter_token_account.mint == vote_account.token_mint @ VoteError::InvalidTokenMint
    )]
    pub voter_token_account: Account<'info, TokenAccount>,
    
    pub token_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
```

---

## 5. Architectural Context

### 5.1 System Overview
BadgerBuild is a blockchain-based shareholder voting platform that combines off-chain KYC verification with on-chain Solana smart contracts to provide secure, transparent, and efficient corporate governance.

### 5.2 Core Components

**Frontend:**
* **Stack:** Next.js 16 (React 19), Tailwind CSS
* **Role:** Provides user interface for shareholders to view proposals, cast votes, and manage delegations
* **Communication:** Connects to backend via REST API, interacts with Solana blockchain via wallet extensions

**Backend:**
* **Stack:** Node.js, Express.js
* **Role:** Orchestrates business logic, integrates with KYC services, manages Solana transactions
* **Services:** KYC verification (Didit), Real Name Registry (lowdb), Solana program client (Anchor)

**Smart Contracts:**
* **Stack:** Rust, Anchor Framework
* **Role:** Immutable vote recording, double-vote prevention, delegation management
* **Program:** Voting contract with instructions for vote creation, casting, delegation, and closure

### 5.3 Data Flow
* **Onboarding:** KYC Verification (off-chain) → Share Token Minting (on-chain) → Real Name Registry (off-chain)
* **Voting:** Vote Creation (on-chain) → Vote Casting (on-chain) → Result Retrieval (on-chain)
* **Delegation:** Delegation Setup (on-chain) → Proxy Voting (on-chain) → Delegation Revocation (on-chain)

---

## 6. File & Repository Standards

* **README.md:** Must serve as the primary entry point for the project. Contains project overview, features, and links to documentation.
* **SETUP.md:** Environment setup, installation, and running instructions.
* **docs/:** Directory containing detailed documentation (ARCHITECTURE.md, API.md, TESTING.md, STYLE.md).
* **Code Comments:** Comments should focus on complex logic, design decisions, or "gotchas." Trivial logic should not be commented.
* **Import Organization:** Organize imports into standard library, third-party, and local modules.

**Backend Import Organization:**
```javascript
// Standard library
const fs = require('fs');
const path = require('path');

// Third-party
const express = require('express');
const anchor = require('@coral-xyz/anchor');
const { Connection, PublicKey } = require('@solana/web3.js');

// Local modules
const { createVerificationSession } = require('./kyc');
const { addUser } = require('./db');
```

**Frontend Import Organization:**
```typescript
// React and Next.js
import { useState, useEffect } from 'react';
import Image from 'next/image';

// Third-party
import { useWallet } from '@solana/wallet-adapter-react';

// Local modules
import VoteCard from '../components/VoteCard';
import { Vote } from '../types/voting';
```

---

## 7. Testing Standards

* **Framework:** Use Anchor's test framework for smart contracts, Jest for backend/frontend
* **Naming Conventions:**
    * Test files: `*.test.ts` (smart contracts), `*.test.js` (backend), `*.test.tsx` (frontend)
    * Test functions: Use descriptive names with `it()` or `test()`
* **Mocking:** Mock external dependencies (Solana RPC, KYC APIs, database) to ensure test isolation
* **Fixtures:** Use test fixtures for common setup/teardown rather than global variables
* **Coverage:** Aim for high test coverage of core functionality (voting, delegation, KYC)

---

## 8. Error Handling

### 8.1 Backend Error Handling
* **Try-Catch:** Wrap async operations in try-catch blocks
* **Status Codes:** Return appropriate HTTP status codes (400, 403, 500)
* **Error Messages:** Provide clear error messages without exposing internal details
* **Logging:** Log errors with context for debugging

**Example:**
```javascript
try {
    const result = await someAsyncOperation();
    res.json({ success: true, data: result });
} catch (error) {
    console.error("Operation failed:", error);
    res.status(500).json({ 
        error: "Operation failed", 
        details: error.message 
    });
}
```

### 8.2 Smart Contract Error Handling
* **Custom Errors:** Define custom error codes in `#[error_code]` enum
* **Validation:** Use `require!` macro for validation with custom errors
* **Error Messages:** Provide clear error messages in error definitions

**Example:**
```rust
#[error_code]
pub enum VoteError {
    #[msg("Voting is already closed for this proposal.")]
    VoteIsClosed,
    #[msg("The token mint provided does not match the one required for this vote.")]
    InvalidTokenMint,
}

// Usage
require!(vote_account.is_active, VoteError::VoteIsClosed);
```

---

## 9. Security Best Practices

### 9.1 Backend Security
* **Environment Variables:** Never commit secrets to git, use `.env` files
* **Admin Authentication:** Require `x-admin-key` header for admin endpoints
* **Input Validation:** Validate all user inputs before processing
* **Error Messages:** Don't expose internal errors to clients

### 9.2 Smart Contract Security
* **Account Validation:** Use Anchor constraints to validate account ownership and state
* **Double-Vote Prevention:** Use PDAs to prevent duplicate votes
* **Access Control:** Use `has_one` constraint to ensure only authority can close votes
* **Token Validation:** Verify token mint matches vote's token mint

### 9.3 Frontend Security
* **Wallet Integration:** Use official Solana wallet adapters
* **Transaction Signing:** Never expose private keys, always use wallet extensions
* **API Calls:** Validate API responses before rendering
* **XSS Prevention:** Use React's built-in XSS protection, sanitize user inputs

---

## 10. Performance Considerations

### 10.1 Backend Performance
* **Connection Pooling:** Reuse Solana connection instances
* **Async Operations:** Use async/await for non-blocking operations
* **Caching:** Cache frequently accessed data (vote results, token balances)
* **Batch Operations:** Batch token minting when possible

### 10.2 Smart Contract Performance
* **Account Space:** Minimize account space to reduce rent costs
* **PDA Usage:** Use PDAs for deterministic addressing without keypairs
* **Constraint Efficiency:** Use efficient constraints to minimize compute units
* **Transaction Batching:** Combine multiple operations in single transaction when possible

### 10.3 Frontend Performance
* **Code Splitting:** Use Next.js automatic code splitting
* **Image Optimization:** Use Next.js Image component for optimized images
* **API Caching:** Cache API responses to reduce network requests
* **Lazy Loading:** Lazy load components that aren't immediately visible

---

## 11. Git & Version Control

* **Commit Messages:** Use clear, descriptive commit messages
* **Branch Naming:** Use descriptive branch names (e.g., `feature/vote-delegation`, `fix/double-vote-prevention`)
* **Pull Requests:** Include description of changes, test results, and screenshots if applicable
* **Code Review:** Require code review before merging to main branch

---

## 12. Documentation Standards

* **API Documentation:** Document all endpoints with request/response formats, status codes, and examples
* **Code Comments:** Comment complex logic, design decisions, and non-obvious behavior
* **README:** Keep README updated with current setup instructions and project status
* **Architecture Docs:** Document architectural decisions and rationale in ARCHITECTURE.md

