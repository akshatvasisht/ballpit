# Environment Setup Instructions

## Prerequisites

### System Dependencies

The Ballpit system requires the following tools to be installed before setup. These dependencies enable smart contract development, blockchain interaction, and full-stack application execution.

**Required:**
- **Node.js** (v18 or higher) - JavaScript runtime for backend (Express.js) and frontend (Next.js)
- **Rust** (latest stable) - Systems programming language for Solana smart contracts
- **Solana CLI** (v1.18 or higher) - Command-line tools for deploying and interacting with Solana programs
- **Anchor Framework** (v0.30.1+) - Rust framework for Solana program development with IDL generation
- **npm** or **yarn** - Package manager for Node.js dependencies

**Optional (for testing):**
- **Playwright** - End-to-end browser testing framework (installed automatically via npm)

### Installing Prerequisites

**Node.js:**
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

**Rust:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

**Solana CLI:**
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version
```

**Anchor Framework:**
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
anchor --version
```

## Setup

### Automated Setup (Recommended)

The fastest way to set up Ballpit is to use the root-level installation script:

```bash
# Clone repository
git clone https://github.com/username/ballpit.git
cd ballpit

# Install all dependencies (backend, frontend, smart contract)
npm run install-all
```

This script will:
1. Install backend Node.js dependencies (`backend/package.json`)
2. Install frontend Node.js dependencies (`frontend/package.json`)
3. Install smart contract Node.js dependencies (`voting_contract/package.json`)

After setup completes, proceed to the [Smart Contract Deployment](#smart-contract-deployment) section.


### Manual Setup (Alternative)

If you prefer to set up each component individually:

#### 1. Clone and Navigate to Project

```bash
git clone https://github.com/username/ballpit.git
cd ballpit
```

#### 2. Smart Contract Setup

**Navigate to voting contract directory:**
```bash
cd voting_contract
```

**Install Rust dependencies:**
```bash
# Anchor will automatically install Rust crates on first build
anchor build
```

**Install Node.js dependencies (for testing):**
```bash
npm install
```

This installs Anchor TypeScript SDK and testing utilities.


### Smart Contract Deployment

**Configure Solana CLI:**
```bash
# Set network to devnet for testing
solana config set --url devnet
```

**Generate or configure wallet:**
```bash
# Option 1: Generate new wallet
solana-keygen new -o ~/.config/solana/id.json

# Option 2: Use existing wallet (set keypair path)
solana config set --keypair ~/.config/solana/id.json
```

**Get test SOL (devnet only):**
```bash
# Request airdrop (2 SOL, may need to repeat for deployment)
solana airdrop 2

# Verify balance
solana balance
```

**Build the smart contract:**
```bash
cd voting_contract
anchor build
```

This compiles the Rust program and generates:
- Program binary: `target/deploy/voting_contract.so`
- IDL file: `target/idl/voting_contract.json`

**Deploy to devnet:**
```bash
anchor deploy
```

**Expected output:**
```
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: <your_wallet_address>
Deploying program "voting_contract"...
Program Id: 5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4
Deploy success
```

**Important:** Copy the `Program Id` from the output. You will need this for the backend `.env` configuration.

**Note on Deployment Costs:** Deploying to devnet requires ~1.68 SOL for program rent. If deployment fails with "insufficient funds," request additional airdrops:
```bash
solana airdrop 2
# Repeat until balance >= 2 SOL
```


### Backend Setup

**Navigate to backend directory:**
```bash
cd ../backend  # From voting_contract directory
```

**Install dependencies:**
```bash
npm install
```

This installs:
- `express` - Web server framework
- `@solana/web3.js` - Solana blockchain SDK
- `@coral-xyz/anchor` - Anchor program client
- `@solana/spl-token` - SPL token utilities
- `lowdb` - Lightweight JSON database
- And other utilities (cors, dotenv, express-rate-limit, zod)

**Create `.env` file:**
```bash
# Create from scratch
touch .env
```

**Configure environment variables** (see [Environment Variables](#environment-variables) section below).

**Start the backend server:**
```bash
npm start
# or for development with auto-reload
node index.js
```

**Expected output:**
```
[INFO] [2025-02-20T12:00:00.000Z] Environment validated: PRIVATE_KEY, PROGRAM_ID, ADMIN_KEY
[INFO] [2025-02-20T12:00:00.001Z] Solana connection established: devnet
[INFO] [2025-02-20T12:00:00.002Z] Program loaded: 5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4
Backend server running on port 3001
```

The backend will start on `http://localhost:3001` (or the port specified in `PORT` environment variable).


### Testing

**Run backend integration tests:**
```bash
npm test
```

This runs the Jest test suite in `backend/tests/api.test.js`.

**Run end-to-end tests:**
```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Run Playwright E2E tests
npx playwright test
```

E2E tests simulate a complete shareholder journey: onboarding → KYC → voting → delegation.


### Frontend Setup

**Navigate to frontend directory:**
```bash
cd ../frontend  # From backend directory
```

**Install dependencies:**
```bash
npm install
```

This installs:
- `next` (v16) - React framework with App Router
- `react` (v19) - UI library
- `tailwindcss` - Utility-first CSS framework
- `@solana/wallet-adapter-react` - Wallet connection utilities
- And UI component libraries (shadcn/ui, lucide-react, etc.)

**Start the development server:**
```bash
npm run dev
```

**Expected output:**
```
  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

 Ready in 2.3s
```

The frontend will be available at `http://localhost:3000`.


### Accessing the Application

1. **Ensure backend is running** on `http://localhost:3001`
2. **Open browser** and navigate to `http://localhost:3000`
3. **Install Solana wallet** (Phantom, Solflare, etc.) if not already installed
4. **Connect wallet** when prompted by the application

**Landing Page:** `http://localhost:3000` - Shareholder onboarding and voting interface
**Admin Portal:** `http://localhost:3000/admin?admin=true` - Company operations console
**Telemetry (if implemented):** `http://localhost:3000/telemetry` - Vote analytics dashboard

## Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

### Required

- **`PRIVATE_KEY`**: JSON array of the backend authority wallet's private key bytes (e.g., `[123,45,67,...]`)
- **`PROGRAM_ID`**: Solana program ID for the voting contract (default: `5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4`)
- **`SHARE_TOKEN_MINT`**: Public key of the share token mint (created via `/api/company/create-token`)
- **`ADMIN_KEY`**: Secret key for admin authentication (used in `x-admin-key` header)

### Optional

- **`PORT`**: Backend server port (default: `3001`)
- **`SOLANA_CLUSTER`**: Solana cluster to connect to (`devnet`, `mainnet-beta`, or `localnet`, default: `devnet`)
- **`DEV_MODE`**: Set to `"true"` to bypass KYC verification for development (default: `false`)

### Obtaining Required Values

**PRIVATE_KEY:**
```bash
# Display your Solana wallet private key as JSON array
cat ~/.config/solana/id.json
# Copy the entire array (e.g., [123,45,67,...])
```

**PROGRAM_ID:**
- Use the Program Id from the `anchor deploy` output
- Default demo value: `5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4`

**SHARE_TOKEN_MINT:**
- Leave blank initially
- After backend starts, call `POST /api/company/create-token` to create token mint
- Update `.env` with the returned mint address

**ADMIN_KEY:**
- Generate a secure random string:
  ```bash
  openssl rand -hex 32
  ```
- Use this value in the `x-admin-key` header for admin API calls

### Example `.env` file:

```env
# Backend wallet private key (JSON array)
PRIVATE_KEY=[123,45,67,89,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64]

# Deployed smart contract program ID
PROGRAM_ID=5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4

# Share token mint (created via /api/company/create-token)
SHARE_TOKEN_MINT=4tbkoExLHa9j62vCshizth9HdQjvyDpSeMnto2DmnMh7

# Admin authentication secret
ADMIN_KEY=a1b2c3d4e5f6789012345678901234567890123456789012345678901234

# Backend server port
PORT=3001

# Solana network (devnet, mainnet-beta, or localnet)
SOLANA_CLUSTER=devnet

# Development mode (bypasses KYC verification)
DEV_MODE=false
```

## Network Configuration

### Solana Network Options

**Devnet (Recommended for Development):**
- Free test SOL available via airdrop
- Public test network
- Fast transaction confirmation
- No real value at risk

**Localnet (For Testing):**
- Run a local Solana validator
- Complete control over network state
- Fastest for development iteration

**Mainnet (Production):**
- Real SOL required for transactions
- Permanent on-chain records
- Production-grade security required

### Configuring Solana CLI

**Set cluster:**
```bash
solana config set --url devnet
```

**Generate wallet (if needed):**
```bash
solana-keygen new
```

**Get test SOL (devnet only):**
```bash
solana airdrop 2
```

**Check balance:**
```bash
solana balance
```

## Running the Project

### Development Workflow

1. **Start Solana validator (if using localnet):**
   ```bash
   solana-test-validator
   ```

2. **Deploy smart contract:**
   ```bash
   cd voting_contract
   anchor deploy
   ```

3. **Start backend server:**
   ```bash
   cd backend
   node index.js
   ```

4. **Start frontend (in separate terminal):**
   ```bash
   cd frontend
   npm run dev
   ```

### Production Deployment

**Backend:**
- Deploy to cloud service (AWS, Heroku, Railway, etc.)
- Set environment variables in hosting platform
- Ensure backend wallet has sufficient SOL for transactions

**Frontend:**
- Build for production: `npm run build`
- Deploy static files to hosting service (Vercel, Netlify, etc.)
- Update API endpoints in frontend configuration

**Smart Contract:**
- Deploy to mainnet-beta: `anchor deploy --provider.cluster mainnet-beta`
- Update `PROGRAM_ID` in backend `.env`
- Ensure sufficient SOL for deployment (~1.68 SOL)

## Notes

- The backend database (`backend/db.json`) uses lowdb for local JSON file storage and is automatically created on first run
- Smart contract IDL files are generated in `voting_contract/target/idl/` after building
- The backend attempts to load IDL from chain first, then falls back to local files
- **Demo Mode**: For development and testing, a "Skip to Dashboard (Bypass)" button is available on the `/verify` page to skip identity verification steps.
- Share tokens must be created before minting shares to shareholders
- The backend authority wallet must have sufficient SOL for transaction fees

## Troubleshooting

### Solana Issues

**"Insufficient funds" error:**
- Get test SOL: `solana airdrop 2` (devnet)
- Check balance: `solana balance`
- Ensure wallet is configured: `solana config get`

**"Program account not found" error:**
- Verify program is deployed: `solana program show <PROGRAM_ID>`
- Check `PROGRAM_ID` in `.env` matches deployed program
- Redeploy if necessary: `anchor deploy`

**"Invalid IDL" error:**
- Rebuild program: `anchor build`
- Copy IDL to backend: `cp target/idl/voting_contract.json ../backend/idl.json`
- Or ensure program is deployed and backend can fetch from chain

### Backend Issues

**"PRIVATE_KEY environment variable is required":**
- Ensure `.env` file exists in `backend/` directory
- Verify `PRIVATE_KEY` is set as JSON array: `[123,45,67,...]`
- Check private key format matches Solana keypair format

**"Failed to create Program from IDL":**
- Deploy program first: `cd voting_contract && anchor deploy`
- Or manually copy IDL: `cp voting_contract/target/idl/voting_contract.json backend/idl.json`
- Check Anchor version compatibility (v0.32.0+)

**"KYC verification error":**
- Enable dev mode: `DEV_MODE=true` in `.env`
- Or ensure the mock kyc session is correctly initialized

### Frontend Issues

**"Cannot connect to backend":**
- Verify backend server is running on correct port
- Check `PORT` environment variable matches frontend API configuration
- Ensure CORS is enabled in backend (should be enabled by default)

**"Web3 connection failed":**
- Install Solana wallet extension (Phantom, Solflare, etc.)
- Connect wallet to correct network (devnet/mainnet)
- Check browser console for specific error messages

### Smart Contract Issues

**Build failures:**
- Ensure Rust toolchain is installed: `rustc --version`
- Update Anchor: `avm install latest && avm use latest`
- Clean and rebuild: `anchor clean && anchor build`

**Deployment failures:**
- Verify sufficient SOL: `solana balance`
- Check network configuration: `solana config get`
- Ensure program ID in `Anchor.toml` matches keypair

**Test failures:**
- Run tests: `anchor test`
- Check test configuration in `Anchor.toml`
- Verify test accounts have sufficient SOL

