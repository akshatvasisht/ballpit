# Environment Setup Instructions

## Prerequisites

### System Dependencies

The following tools must be installed before setting up BadgerBuild:

- **Node.js** (v18 or higher) - For backend and frontend
- **Rust** (latest stable) - For Solana smart contract development
- **Solana CLI** (v1.18 or higher) - For deploying and interacting with Solana programs
- **Anchor Framework** (v0.32.0 or higher) - For Solana program development
- **Yarn** or **npm** - Package manager

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

### 1. Clone and Navigate to Project

```bash
git clone <repository-url>
cd BadgerBuild
```

### 2. Smart Contract Setup

**Navigate to voting contract directory:**
```bash
cd voting_contract
```

**Install dependencies:**
```bash
yarn install
# or
npm install
```

**Build the program:**
```bash
anchor build
```

**Deploy to devnet (requires ~1.68 SOL):**
```bash
# Ensure you have a Solana wallet configured
solana config set --url devnet
solana airdrop 2  # Get test SOL (if needed)

# Deploy the program
anchor deploy
```

**Note:** After deployment, copy the program ID from the output and update it in your `.env` files.

### 3. Backend Setup

**Navigate to backend directory:**
```bash
cd backend
```

**Install dependencies:**
```bash
npm install
```

**Create `.env` file:**
```bash
cp .env.example .env  # If example exists, or create manually
```

**Configure environment variables** (see Environment Variables section below).

**Start the backend server:**
```bash
npm start
# or for development with auto-reload
node index.js
```

The backend will start on `http://localhost:3001` (or the port specified in `PORT` environment variable).

### 4. Frontend Setup

**Navigate to frontend directory:**
```bash
cd frontend
```

**Install dependencies:**
```bash
npm install
```

**Start the development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Accessing the Application

Open `http://localhost:3000` in your browser to access the BadgerBuild interface.

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
- **`DIDIT_API_KEY`**: API key for Didit KYC verification service
- **`DIDIT_WORKFLOW_ID`**: Workflow ID for Didit KYC verification
- **`DEV_MODE`**: Set to `"true"` to bypass KYC verification for development (default: `false`)

### Example `.env` file:

```env
PRIVATE_KEY=[123,45,67,89,...]
PROGRAM_ID=5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4
SHARE_TOKEN_MINT=4tbkoExLHa9j62vCshizth9HdQjvyDpSeMnto2DmnMh7
ADMIN_KEY=your-secret-admin-key-here
PORT=3001
SOLANA_CLUSTER=devnet
DIDIT_API_KEY=your-didit-api-key
DIDIT_WORKFLOW_ID=your-workflow-id
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
- KYC verification requires valid Didit API credentials (or use `DEV_MODE=true` for development)
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
- Verify `DIDIT_API_KEY` and `DIDIT_WORKFLOW_ID` are set
- Or enable dev mode: `DEV_MODE=true` in `.env`
- Check Didit API credentials are valid

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

