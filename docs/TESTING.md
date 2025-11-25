# Testing Guidelines

This document describes the testing approach, standards, and procedures for the BadgerBuild project.

## Automated Tests

### Smart Contract Tests (Anchor)

**Location:** `voting_contract/tests/voting-contract.ts`

**Running Tests:**
```bash
cd voting_contract
anchor test
```

**Test Structure:**
- Tests are written in TypeScript using Anchor's test framework
- Tests run against a local Solana validator (automatically started)
- Each test file should test a specific instruction or feature

**Example Test:**
```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VotingContract } from "../target/types/voting_contract";
import { expect } from "chai";

describe("voting_contract", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.VotingContract as Program<VotingContract>;
  
  it("Initializes a vote", async () => {
    const voteAccount = anchor.web3.Keypair.generate();
    const title = "Test Proposal";
    const tokenMint = anchor.web3.Keypair.generate();
    
    await program.methods
      .initializeVote(title, tokenMint.publicKey)
      .accounts({
        voteAccount: voteAccount.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([voteAccount])
      .rpc();
    
    const voteData = await program.account.voteAccount.fetch(voteAccount.publicKey);
    expect(voteData.title).to.equal(title);
    expect(voteData.isActive).to.be.true;
  });
});
```

### Backend Tests

**Location:** `backend/tests/` (to be created)

**Running Tests:**
```bash
cd backend
npm test
```

**Test Framework:** Jest or Mocha (to be configured)

**Mocking Requirements:**
- Mock Solana RPC calls (`@solana/web3.js`)
- Mock Anchor program client (`@coral-xyz/anchor`)
- Mock Didit KYC API calls (`axios`)
- Mock lowdb database operations

**Example Test:**
```javascript
const request = require('supertest');
const app = require('../index');
const { mockSolanaConnection } = require('./mocks/solana');

describe('POST /api/company/create-vote', () => {
  beforeEach(() => {
    mockSolanaConnection();
  });
  
  it('creates a vote with valid admin key', async () => {
    const response = await request(app)
      .post('/api/company/create-vote')
      .set('x-admin-key', process.env.ADMIN_KEY)
      .send({ title: 'Test Proposal' });
    
    expect(response.status).toBe(200);
    expect(response.body.voteAccount).toBeDefined();
  });
  
  it('rejects request without admin key', async () => {
    const response = await request(app)
      .post('/api/company/create-vote')
      .send({ title: 'Test Proposal' });
    
    expect(response.status).toBe(403);
  });
});
```

### Frontend Tests

**Location:** `frontend/__tests__/` (to be created)

**Running Tests:**
```bash
cd frontend
npm test
```

**Test Framework:** Jest with React Testing Library

**Example Test:**
```typescript
import { render, screen } from '@testing-library/react';
import VoteList from '../components/VoteList';

describe('VoteList', () => {
  it('displays votes from API', async () => {
    const mockVotes = [
      { voteAccount: 'abc123', title: 'Test Proposal', isActive: true }
    ];
    
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ votes: mockVotes })
    });
    
    render(<VoteList />);
    
    expect(await screen.findByText('Test Proposal')).toBeInTheDocument();
  });
});
```

## Manual Tests

### End-to-End Voting Flow

**Purpose:** Test the complete voting workflow from KYC to vote casting.

**Steps:**
1. Start backend server: `cd backend && node index.js`
2. Start frontend: `cd frontend && npm run dev`
3. Deploy smart contract: `cd voting_contract && anchor deploy`
4. Create share token via `/api/company/create-token` (admin)
5. Create KYC session via `/api/kyc/verify`
6. Complete KYC verification (or use `DEV_MODE=true`)
7. Claim share token via `/api/user/claim-share`
8. Create vote proposal via `/api/company/create-vote` (admin)
9. Cast vote via `/api/user/cast-vote` (sign transaction in frontend)
10. Verify vote receipt exists on-chain
11. Check vote results via `/api/user/vote/:voteAccount`

**Expected Results:**
- Share token minted to shareholder wallet
- Vote proposal created on-chain
- Vote cast successfully
- VoteReceipt PDA created
- Vote counts incremented correctly

### Delegation Flow

**Purpose:** Test proxy voting via delegation.

**Steps:**
1. Set up two wallets (owner and delegate)
2. Owner claims share token
3. Owner sets delegate via `/api/user/delegate`
4. Verify delegation PDA exists
5. Delegate casts proxy vote via `/api/user/cast-proxy-vote`
6. Verify vote is recorded with owner's token weight
7. Verify VoteReceipt uses owner's key (not delegate's)
8. Owner revokes delegation via `/api/user/revoke-delegate`
9. Verify delegation PDA is closed

**Expected Results:**
- Delegation PDA created with correct owner/delegate/mint
- Proxy vote recorded successfully
- VoteReceipt prevents owner from voting again
- Delegation revoked and account closed

### Error Handling Tests

**Purpose:** Verify error handling for edge cases.

**Test Cases:**
1. **Double Voting:** Attempt to vote twice on same proposal
   - Expected: Second vote fails with appropriate error
   
2. **Voting Without Tokens:** Attempt to vote without share tokens
   - Expected: Error "Insufficient share tokens to vote"
   
3. **Voting on Closed Vote:** Attempt to vote after vote is closed
   - Expected: Error "Voting is already closed"
   
4. **Invalid Token Mint:** Attempt to vote with wrong token
   - Expected: Error "Invalid token mint"
   
5. **Invalid Delegate:** Attempt proxy vote with wrong delegate
   - Expected: Error "Invalid delegate"
   
6. **KYC Not Approved:** Attempt to claim share without KYC approval
   - Expected: Error "KYC verification not complete" (unless `DEV_MODE=true`)

### Network Configuration Tests

**Purpose:** Verify system works across different Solana networks.

**Test Networks:**
- **Localnet:** Run `solana-test-validator` and test locally
- **Devnet:** Deploy to devnet and test with test SOL
- **Mainnet:** Production testing (use small amounts)

**Steps:**
1. Update `SOLANA_CLUSTER` in `.env`
2. Configure Solana CLI: `solana config set --url <network>`
3. Deploy program: `anchor deploy`
4. Update `PROGRAM_ID` in backend `.env`
5. Run full test suite

## Test Structure and Naming Conventions

### Smart Contract Tests

- **File naming:** `*.ts` in `voting_contract/tests/`
- **Test naming:** Descriptive test names explaining what is being tested
- **Grouping:** Group related tests in `describe` blocks

```typescript
describe("VoteAccount", () => {
  describe("initialize_vote", () => {
    it("creates vote account with correct initial state", async () => {
      // Test implementation
    });
    
    it("rejects duplicate vote account creation", async () => {
      // Test implementation
    });
  });
});
```

### Backend Tests

- **File naming:** `*.test.js` or `*.spec.js` in `backend/tests/`
- **Test naming:** Use descriptive names with `it()` or `test()`
- **Grouping:** Group by endpoint or feature

```javascript
describe('POST /api/user/cast-vote', () => {
  it('should cast vote successfully', async () => {
    // Test implementation
  });
  
  it('should reject vote without tokens', async () => {
    // Test implementation
  });
});
```

### Frontend Tests

- **File naming:** `*.test.tsx` or `*.spec.tsx` in component directories
- **Test naming:** Use descriptive names with `it()` or `test()`
- **Grouping:** Group by component or feature

```typescript
describe('VoteCard', () => {
  it('renders vote title and status', () => {
    // Test implementation
  });
  
  it('handles vote button click', () => {
    // Test implementation
  });
});
```

## Mocking Requirements

### Solana RPC Mocking

Mock `@solana/web3.js` Connection methods:

```javascript
const mockConnection = {
  getAccountInfo: jest.fn(),
  getProgramAccounts: jest.fn(),
  sendTransaction: jest.fn(),
  // ... other methods
};
```

### Anchor Program Mocking

Mock Anchor program client:

```javascript
const mockProgram = {
  methods: {
    initializeVote: jest.fn().mockReturnValue({
      accounts: jest.fn().mockReturnValue({
        signers: jest.fn().mockReturnValue({
          rpc: jest.fn().mockResolvedValue('transaction_signature')
        })
      })
    })
  },
  account: {
    voteAccount: {
      fetch: jest.fn(),
      all: jest.fn()
    }
  }
};
```

### KYC API Mocking

Mock Didit API calls:

```javascript
const axios = require('axios');
jest.mock('axios');

axios.post.mockResolvedValue({
  data: {
    url: 'https://verification.didit.me/...',
    id: 'session_123'
  }
});

axios.get.mockResolvedValue({
  data: {
    status: 'Approved'
  }
});
```

### Database Mocking

Mock lowdb operations:

```javascript
const mockDb = {
  get: jest.fn().mockReturnValue({
    push: jest.fn().mockReturnValue({
      write: jest.fn()
    }),
    find: jest.fn().mockReturnValue({
      value: jest.fn().mockReturnValue(null)
    }),
    value: jest.fn().mockReturnValue([])
  })
};
```

## Writing New Tests

### Test Structure

Follow this pattern for new tests:

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup: Reset mocks, create test data
  });
  
  afterEach(() => {
    // Cleanup: Clear mocks, reset state
  });
  
  it('should do something specific', async () => {
    // Arrange: Set up test data and mocks
    const testData = { /* ... */ };
    
    // Act: Execute the code under test
    const result = await functionUnderTest(testData);
    
    // Assert: Verify expected behavior
    expect(result).toEqual(expectedValue);
  });
});
```

### Best Practices

1. **Isolation:** Each test should be independent and not rely on other tests
2. **Naming:** Use descriptive test names that explain what is being tested
3. **Mocking:** Mock external dependencies (APIs, blockchain, database)
4. **Fixtures:** Use test fixtures for common setup/teardown
5. **Assertions:** Use specific assertions with clear error messages
6. **Coverage:** Aim for high test coverage of core functionality

### Example: Smart Contract Test

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VotingContract } from "../target/types/voting_contract";
import { expect } from "chai";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

describe("cast_vote", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.VotingContract as Program<VotingContract>;
  
  let voteAccount: anchor.web3.Keypair;
  let tokenMint: anchor.web3.PublicKey;
  let voter: anchor.web3.Keypair;
  let voterTokenAccount: anchor.web3.PublicKey;
  
  beforeEach(async () => {
    // Setup: Create vote account, mint tokens, etc.
    voteAccount = anchor.web3.Keypair.generate();
    tokenMint = anchor.web3.Keypair.generate().publicKey;
    voter = anchor.web3.Keypair.generate();
    
    // Initialize vote
    await program.methods
      .initializeVote("Test Proposal", tokenMint)
      .accounts({
        voteAccount: voteAccount.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([voteAccount])
      .rpc();
    
    // Mint tokens to voter (simplified - actual implementation would use SPL token)
    voterTokenAccount = await getAssociatedTokenAddress(tokenMint, voter.publicKey);
  });
  
  it("should cast a vote successfully", async () => {
    // Act: Cast vote
    await program.methods
      .castVote(true) // Vote "for"
      .accounts({
        voteAccount: voteAccount.publicKey,
        voteReceipt: /* derive PDA */,
        voter: voter.publicKey,
        voterTokenAccount: voterTokenAccount,
        tokenMint: tokenMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([voter])
      .rpc();
    
    // Assert: Verify vote was recorded
    const voteData = await program.account.voteAccount.fetch(voteAccount.publicKey);
    expect(voteData.votesFor.toString()).to.equal("1");
    expect(voteData.votesAgainst.toString()).to.equal("0");
  });
  
  it("should prevent double voting", async () => {
    // Cast first vote
    await program.methods.castVote(true).accounts({ /* ... */ }).rpc();
    
    // Attempt second vote (should fail)
    try {
      await program.methods.castVote(false).accounts({ /* ... */ }).rpc();
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.message).to.include("already in use");
    }
  });
});
```

## Continuous Integration

Tests should be run automatically in CI/CD pipelines:

**Example GitHub Actions workflow:**
```yaml
name: Test

on: [push, pull_request]

jobs:
  test-smart-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - uses: actions-rs/toolchain@v1
      - name: Install Anchor
        run: cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
      - name: Run tests
        run: |
          cd voting_contract
          anchor test
  
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: cd backend && npm install
      - name: Run tests
        run: cd backend && npm test
  
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: cd frontend && npm install
      - name: Run tests
        run: cd frontend && npm test
```

## Troubleshooting Tests

### Common Issues

**Smart Contract Tests:**
- **"Program account not found":** Ensure program is deployed or tests use local validator
- **"Insufficient funds":** Fund test accounts with SOL before tests
- **"Account already in use":** Clean up test accounts between tests

**Backend Tests:**
- **Import errors:** Ensure virtual environment is set up and dependencies installed
- **Mock failures:** Verify mock setup matches actual implementation
- **Database errors:** Reset database state between tests

**Frontend Tests:**
- **Module resolution errors:** Check TypeScript configuration and import paths
- **React rendering errors:** Ensure test environment is configured correctly
- **API mocking failures:** Verify fetch mocks match actual API calls

### Test Data Management

- Use fixtures for consistent test data
- Clean up test accounts and state after tests
- Use unique identifiers to avoid conflicts
- Mock external services to ensure test isolation

