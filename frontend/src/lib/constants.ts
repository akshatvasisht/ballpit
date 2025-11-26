// Solana Configuration Constants
export const SOLANA_CONFIG = {
  network: 'devnet' as const,
  rpcUrl: 'https://api.devnet.solana.com',
  explorerUrl: 'https://explorer.solana.com',
  cluster: 'devnet' as const,
} as const;

// Program IDs
export const PROGRAM_IDS = {
  votingProgram: '5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4',
  authorityWallet: '78YbbLUFFoVpsSY7GcfRgo4Y1bCdVLqjnvocSQGHTLeq',
  // Add other program IDs here
} as const;

// Token Configuration
export const TOKEN_CONFIG = {
  shareTokenMint: '4tbkoExLHa9j62vCshizth9HdQjvyDpSeMnto2DmnMh7',
  decimals: 0, // Share tokens are non-divisible
} as const;

// API Configuration
export const API_CONFIG = {
  baseUrl: 'http://localhost:3001',
} as const;

// Transaction Configuration
export const TX_CONFIG = {
  confirmationTimeout: 30000, // 30 seconds
  maxRetries: 3,
  computeUnitsLimit: 200000,
} as const;

// Account Space Calculations (for rent estimation)
export const ACCOUNT_SIZES = {
  voteAccount: 8 + 32 + 1 + (4 + 256) + 32 + 8 + 8, // 349 bytes
  voteReceipt: 8 + 32 + 32 + 1, // 73 bytes
  delegation: 8 + 32 + 32 + 32, // 104 bytes
} as const;

// Helper function to get explorer link
export function getExplorerUrl(type: 'tx' | 'address' | 'block', value: string): string {
  return `${SOLANA_CONFIG.explorerUrl}/${type}/${value}?cluster=${SOLANA_CONFIG.cluster}`;
}

// Helper function to get API endpoint
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.baseUrl}${endpoint}`;
}

// Helper function to format public key (truncate)
export function formatPublicKey(pubkey: string, chars: number = 4): string {
  return `${pubkey.slice(0, chars)}...${pubkey.slice(-chars)}`;
}

// Solana-specific error messages
export const SOLANA_ERRORS: Record<string, string> = {
  '0x0': 'Account already exists',
  '0x1': 'Voting is closed for this proposal',
  '0x2': 'Invalid token mint',
  '0x3': 'Not enough tokens to vote',
  '0x4': 'Invalid delegate',
  '0x5': 'Delegate not authorized',
  'insufficient funds': 'Insufficient SOL for transaction fee (~0.000005 SOL needed)',
  'blockhash not found': 'Transaction expired. Please try again.',
  'User rejected': 'Transaction cancelled by user',
};

// Parse Solana error
export function parseSolanaError(error: unknown): string {
  const errObj = error as Record<string, unknown>;
  const errorMsg = (errObj?.message as string) || String(error) || '';

  for (const [code, message] of Object.entries(SOLANA_ERRORS)) {
    if (errorMsg.includes(code)) {
      return message;
    }
  }

  return 'Transaction failed. Please try again.';
}
