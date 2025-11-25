const express = require("express");
const cors = require("cors");
const {
  Connection,
  PublicKey,
  Keypair,
  clusterApiUrl,
  SystemProgram,
} = require("@solana/web3.js");
const {
  getOrCreateAssociatedTokenAccount,
  createMint,
  mintTo,
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");
const anchor = require("@coral-xyz/anchor");
const fs = require("fs");
const { createVerificationSession, checkVerificationStatus } = require("./kyc");
const { addUser, getUserByWallet, getAllUsers } = require("./db");
require("dotenv").config();

// --- 1. SETUP UP THE SERVER ---
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3001;

// --- 2. CONNECT TO SOLANA & LOAD WALLET ---
const cluster = process.env.SOLANA_CLUSTER || "devnet";
const connection = new Connection(clusterApiUrl(cluster), "confirmed");

if (!process.env.PRIVATE_KEY) {
  console.error("❌ PRIVATE_KEY environment variable is required");
  process.exit(1);
}

const privateKey = JSON.parse(process.env.PRIVATE_KEY);
const authorityWallet = Keypair.fromSecretKey(new Uint8Array(privateKey));
console.log("Backend Authority Wallet:", authorityWallet.publicKey.toBase58());

// --- 3. LOAD CONFIGURATION FROM ENVIRONMENT ---
const programId = new PublicKey(
  process.env.PROGRAM_ID || "5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4"
);
const shareTokenMint = new PublicKey(
  process.env.SHARE_TOKEN_MINT || "4tbkoExLHa9j62vCshizth9HdQjvyDpSeMnto2DmnMh7"
);
const ADMIN_KEY = process.env.ADMIN_KEY;

// --- 4. LOAD THE ANCHOR PROGRAM ---
// Create the "Anchor Provider"
const provider = new anchor.AnchorProvider(
  connection,
  new anchor.Wallet(authorityWallet),
  {
    preflightCommitment: "confirmed",
    commitment: "confirmed",
  }
);

// Set the provider as default
anchor.setProvider(provider);

// Load the Program - try fetching from chain first (handles IDL format issues)
// Declare program in module scope so endpoints can access it
let program;

(async () => {
  try {
    // First, try to fetch IDL from chain (this ensures correct format)
    console.log("Attempting to fetch IDL from chain...");
    
    // Workaround: Use anchor's IDL account fetching directly to bypass the bug
    try {
      const chainIdl = await anchor.Program.fetchIdl(programId, provider);
      if (chainIdl) {
        program = new anchor.Program(chainIdl, programId, provider);
        console.log(`✅ Loaded Smart Contract from chain: ${program.programId.toBase58()}`);
        startServer();
        return;
      }
    } catch (fetchError) {
      // fetchIdl might fail due to Anchor 0.32.1 bug, try alternative method
      console.log("fetchIdl failed, trying alternative IDL fetch method...");
      
      // Try using the IDL from file but ensure it's the latest from target
      const targetIdlPath = "../voting-contract/target/idl/voting_contract.json";
      if (fs.existsSync(targetIdlPath)) {
        const targetIdl = JSON.parse(fs.readFileSync(targetIdlPath, "utf8"));
        // Merge types into accounts for compatibility
        const typeMap = new Map();
        targetIdl.types.forEach(type => {
          typeMap.set(type.name, type);
        });
        targetIdl.accounts = targetIdl.accounts.map(acc => {
          const typeDef = typeMap.get(acc.name);
          if (typeDef) {
            return {
              name: acc.name,
              discriminator: acc.discriminator,
              docs: typeDef.docs || [],
              type: typeDef.type
            };
          }
          return acc;
        });
        
        program = new anchor.Program(targetIdl, programId, provider);
        console.log(`✅ Loaded Smart Contract from target IDL: ${program.programId.toBase58()}`);
        startServer();
        return;
      }
      throw fetchError;
    }
  } catch (chainError) {
    console.log("Could not fetch IDL from chain, trying file...");
    console.log("Chain error:", chainError.message);
    
    // Try multiple IDL sources
    const idlPaths = [
      "./idl.json",
      "../voting-contract/target/idl/voting_contract.json"
    ];
    
    let idl = null;
    let loadedPath = null;
    
    for (const idlPath of idlPaths) {
      try {
        if (fs.existsSync(idlPath)) {
          const idlJson = fs.readFileSync(idlPath, "utf8");
          idl = JSON.parse(idlJson);
          loadedPath = idlPath;
          console.log(`✅ Found IDL at: ${idlPath}`);
          break;
        }
      } catch (err) {
        // Continue to next path
        continue;
      }
    }
    
    if (!idl) {
      console.error("❌ Could not find IDL file in any expected location");
      console.error("Tried paths:", idlPaths);
      process.exit(1);
    }
    
    // Validate IDL structure
    if (!idl.accounts || !Array.isArray(idl.accounts)) {
      throw new Error("IDL missing accounts array");
    }
    if (!idl.types || !Array.isArray(idl.types)) {
      throw new Error("IDL missing types array");
    }
    
    // Workaround for Anchor 0.32.1 IDL parsing issue
    // Try to create program with error handling
    try {
      console.log("Attempting to create Program from IDL file...");
      program = new anchor.Program(idl, programId, provider);
      console.log(`✅ Loaded Smart Contract: ${program.programId.toBase58()}`);
      startServer();
    } catch (programError) {
      console.error("❌ Failed to create Program from IDL");
      console.error("Error:", programError.message);
      console.error("\nThis is a known issue with Anchor 0.32.1 and IDL parsing.");
      console.error("\nSolutions:");
      console.error("1. Deploy the program first (requires ~1.68 SOL):");
      console.error("   cd ../voting-contract && anchor deploy");
      console.error("2. Or try using a different Anchor version");
      console.error("3. Or manually fix the IDL structure");
      console.error("\nFor now, the server will start but program calls will fail.");
      console.error("You can still test the API structure, but smart contract calls won't work.");
      
      // Create a dummy program object to prevent crashes
      program = {
        programId: programId,
        methods: {},
        account: {},
        _idl: idl
      };
      
      startServer();
    }
  }
})();

// Function to start server after program is loaded
function startServer() {

// ===============================================
// --- HELPER FUNCTIONS ---
// ===============================================

/**
 * Helper function to derive the delegation PDA address
 * @param {PublicKey} ownerPubkey - The owner's public key
 * @param {PublicKey} tokenMintPubkey - The token mint public key
 * @returns {PublicKey} The delegation PDA address
 */
function getDelegationPDA(ownerPubkey, tokenMintPubkey) {
  const [delegationPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("delegation"),
      ownerPubkey.toBuffer(),
      tokenMintPubkey.toBuffer(),
    ],
    program.programId
  );
  return delegationPDA;
}

// ===============================================
// --- ADMIN SECURITY MIDDLEWARE ---
// ===============================================

/**
 * Middleware to require admin authentication for company endpoints
 * Checks for x-admin-key header matching ADMIN_KEY environment variable
 */
function requireAdmin(req, res, next) {
  const adminKey = req.headers["x-admin-key"];
  
  if (!ADMIN_KEY) {
    console.error("❌ ADMIN_KEY environment variable is not set");
    return res.status(500).json({ error: "Server configuration error: ADMIN_KEY not set" });
  }
  
  if (!adminKey || adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: "Forbidden: Admin authentication required" });
  }
  
  next();
}

// ===============================================
// --- KYC ENDPOINTS ---
// ===============================================

/**
 * @route POST /api/kyc/verify
 * @desc Create a verification session with Didit
 * @body { "walletAddress": "..." }
 */
app.post("/api/kyc/verify", async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    const result = await createVerificationSession(walletAddress);
    res.json({
      verificationUrl: result.url,
      sessionId: result.session_id,
    });
  } catch (error) {
    console.error("KYC verification error:", error);
    res.status(500).json({ error: "Failed to create verification session", details: error.message });
  }
});

/**
 * @route GET /api/kyc/status/:sessionId
 * @desc Check the verification status of a session
 * @param {string} sessionId - The session ID to check
 */
app.get("/api/kyc/status/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const status = await checkVerificationStatus(sessionId);
    res.json({ status });
  } catch (error) {
    console.error("KYC status check error:", error);
    res.status(500).json({ error: "Failed to check verification status", details: error.message });
  }
});

// ===============================================
// --- COMPANY ENDPOINTS ---
// ===============================================

/**
 * @route POST /api/company/create-token
 * @desc Create a new share token for the company
 */
app.post("/api/company/create-token", requireAdmin, async (req, res) => {
  try {
    console.log("Creating company's 'Share Token' on", cluster, "...");
    const mint = await createMint(
      connection,
      authorityWallet,
      authorityWallet.publicKey,
      authorityWallet.publicKey,
      0
    );
    console.log("✅ Share Token Created:", mint.toBase58());
    res.json({
      message: "Token created successfully",
      tokenMint: mint.toBase58(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create token" });
  }
});

/**
 * @route POST /api/company/mint-share
 * @desc Mint share tokens to a verified shareholder
 * @body { "shareholderWallet": "...", "amount": 1 }
 */
app.post("/api/company/mint-share", requireAdmin, async (req, res) => {
  try {
    const { shareholderWallet, amount = 1 } = req.body;
    if (!shareholderWallet) {
      return res.status(400).json({ error: "Shareholder wallet is required" });
    }

    const shareholderPublicKey = new PublicKey(shareholderWallet);
    console.log(`Minting ${amount} share(s) to ${shareholderWallet}...`);

    const shareholderTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      authorityWallet,
      shareTokenMint,
      shareholderPublicKey
    );
    await mintTo(
      connection,
      authorityWallet,
      shareTokenMint,
      shareholderTokenAccount.address,
      authorityWallet,
      amount
    );

    res.json({
      message: "Share token minted successfully",
      tokenAccount: shareholderTokenAccount.address.toBase58(),
      amount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to mint token" });
  }
});

/**
 * @route POST /api/company/create-vote
 * @desc Create a new vote (Ballot Box)
 * @body { "title": "..." }
 */
app.post("/api/company/create-vote", requireAdmin, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Vote title is required" });
    }

    // Generate a new keypair for the "Ballot Box" account
    const voteAccount = Keypair.generate();
    console.log(
      `New Vote Account (Ballot Box) Pubkey: ${voteAccount.publicKey.toBase58()}`
    );

    // Call our smart contract's `initializeVote` instruction
    const tx = await program.methods
      .initializeVote(title, shareTokenMint)
      .accounts({
        voteAccount: voteAccount.publicKey,
        authority: authorityWallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authorityWallet, voteAccount])
      .rpc();

    console.log("✅ New Vote Created! Transaction signature:", tx);
    res.json({
      message: "Vote created successfully",
      voteAccount: voteAccount.publicKey.toBase58(),
      transaction: tx,
    });
  } catch (error) {
    console.error("Failed to initialize vote:", error);
    res.status(500).json({ error: "Failed to initialize vote", details: error.message });
  }
});

/**
 * @route GET /api/company/votes
 * @desc Get all votes created by the company
 */
app.get("/api/company/votes", async (req, res) => {
  try {
    // Fetch total supply for participation analytics
    const mintInfo = await getMint(connection, shareTokenMint);
    const totalSupply = Number(mintInfo.supply);

    // Fetch votes filtered by authority (only votes created by this backend)
    const voteAccounts = await program.account.voteAccount.all([
      {
        memcmp: {
          offset: 8, // Skip 8-byte discriminator
          bytes: authorityWallet.publicKey.toBase58()
        }
      }
    ]);

    // Map results to clean JSON structure with participation analytics
    const votes = voteAccounts.map(({ publicKey, account }) => {
      const votesFor = Number(account.votesFor.toString());
      const votesAgainst = Number(account.votesAgainst.toString());
      const totalVotesCast = votesFor + votesAgainst;
      
      // Calculate participation rate (handle division by zero)
      let participationRate = "0.00%";
      if (totalSupply > 0) {
        const participationPct = (totalVotesCast / totalSupply) * 100;
        participationRate = participationPct.toFixed(2) + "%";
      }

      return {
        voteAccount: publicKey.toBase58(),
        title: account.title,
        votesFor: account.votesFor.toString(),
        votesAgainst: account.votesAgainst.toString(),
        totalVotes: totalVotesCast,
        participationRate: participationRate,
        totalSupply: totalSupply,
        isActive: account.isActive,
        authority: account.authority.toBase58(),
        tokenMint: account.tokenMint.toBase58(),
      };
    });

    res.json({ votes });
  } catch (error) {
    console.error("Failed to fetch votes:", error);
    res.status(500).json({ error: "Failed to fetch votes" });
  }
});

/**
 * @route GET /api/company/vote/:voteAccount
 * @desc Get specific vote details and results
 */
app.get("/api/company/vote/:voteAccount", async (req, res) => {
  try {
    const { voteAccount } = req.params;
    const voteAccountPubkey = new PublicKey(voteAccount);

    // Fetch vote account from blockchain
    const voteAccountData = await program.account.voteAccount.fetch(
      voteAccountPubkey
    );

    res.json({
      voteAccount: voteAccount,
      title: voteAccountData.title,
      isActive: voteAccountData.isActive,
      votesFor: voteAccountData.votesFor.toString(),
      votesAgainst: voteAccountData.votesAgainst.toString(),
      tokenMint: voteAccountData.tokenMint.toBase58(),
      authority: voteAccountData.authority.toBase58(),
    });
  } catch (error) {
    console.error("Failed to fetch vote:", error);
    res.status(500).json({ error: "Failed to fetch vote", details: error.message });
  }
});

/**
 * @route POST /api/company/close-vote
 * @desc Close a vote (stop accepting new votes)
 * @body { "voteAccount": "..." }
 */
app.post("/api/company/close-vote", requireAdmin, async (req, res) => {
  try {
    const { voteAccount } = req.body;
    if (!voteAccount) {
      return res.status(400).json({ error: "Vote account is required" });
    }

    const voteAccountPubkey = new PublicKey(voteAccount);

    const tx = await program.methods
      .closeVote()
      .accounts({
        voteAccount: voteAccountPubkey,
        authority: authorityWallet.publicKey,
      })
      .rpc();

    res.json({
      message: "Vote closed successfully",
      transaction: tx,
    });
  } catch (error) {
    console.error("Failed to close vote:", error);
    res.status(500).json({ error: "Failed to close vote", details: error.message });
  }
});

/**
 * @route GET /api/company/shareholders
 * @desc Get all shareholders from the Real Name Registry
 * @protected Admin only
 */
app.get("/api/company/shareholders", requireAdmin, async (req, res) => {
  try {
    const users = getAllUsers();
    
    const shareholders = users.map(user => ({
      walletAddress: user.walletAddress,
      realName: user.realName,
      kycSessionId: user.kycSessionId,
    }));

    res.json({ shareholders });
  } catch (error) {
    console.error("Failed to fetch shareholders:", error);
    res.status(500).json({ error: "Failed to fetch shareholders", details: error.message });
  }
});

/**
 * @route GET /api/company/vote-details/:voteAccount
 * @desc Get vote details with real names for a specific vote account
 * @protected Admin only
 * @param {string} voteAccount - The vote account public key
 */
app.get("/api/company/vote-details/:voteAccount", requireAdmin, async (req, res) => {
  try {
    const { voteAccount } = req.params;
    const voteAccountPubkey = new PublicKey(voteAccount);

    // Fetch all VoteReceipt accounts for this vote account
    // Offset: 8 (discriminator) + 32 (voter field) = 40 to reach vote_account field
    const voteReceipts = await program.account.voteReceipt.all([
      {
        memcmp: {
          offset: 40,
          bytes: voteAccountPubkey.toBase58(),
        },
      },
    ]);

    // Map receipts to include real names from database
    const voteDetails = voteReceipts.map(({ account }) => {
      const voterWallet = account.voter.toBase58();
      const user = getUserByWallet(voterWallet);
      
      return {
        voterName: user ? user.realName : null,
        wallet: voterWallet,
        voteDirection: account.votedFor ? "For" : "Against",
      };
    });

    res.json({ voteDetails });
  } catch (error) {
    console.error("Failed to fetch vote details:", error);
    res.status(500).json({ error: "Failed to fetch vote details", details: error.message });
  }
});

// ===============================================
// --- USER ENDPOINTS ---
// ===============================================

/**
 * @route GET /api/user/votes
 * @desc Get all available votes for users
 */
app.get("/api/user/votes", async (req, res) => {
  try {
    // Fetch all votes from blockchain (no filter)
    const voteAccounts = await program.account.voteAccount.all();

    // Map results to clean JSON structure
    const votes = voteAccounts.map(({ publicKey, account }) => ({
      voteAccount: publicKey.toBase58(),
      title: account.title,
      votesFor: account.votesFor.toString(),
      votesAgainst: account.votesAgainst.toString(),
      isActive: account.isActive,
      authority: account.authority.toBase58(),
      tokenMint: account.tokenMint.toBase58(),
    }));

    res.json({ votes });
  } catch (error) {
    console.error("Failed to fetch votes:", error);
    res.status(500).json({ error: "Failed to fetch votes" });
  }
});

/**
 * @route GET /api/user/vote/:voteAccount
 * @desc Get specific vote details for a user
 */
app.get("/api/user/vote/:voteAccount", async (req, res) => {
  try {
    const { voteAccount } = req.params;
    const voteAccountPubkey = new PublicKey(voteAccount);

    // Fetch vote account from blockchain
    const voteAccountData = await program.account.voteAccount.fetch(
      voteAccountPubkey
    );

    res.json({
      voteAccount: voteAccount,
      title: voteAccountData.title,
      isActive: voteAccountData.isActive,
      votesFor: voteAccountData.votesFor.toString(),
      votesAgainst: voteAccountData.votesAgainst.toString(),
      tokenMint: voteAccountData.tokenMint.toBase58(),
    });
  } catch (error) {
    console.error("Failed to fetch vote:", error);
    res.status(500).json({ error: "Failed to fetch vote", details: error.message });
  }
});

/**
 * @route POST /api/user/claim-share
 * @desc Allow a verified user to mint their share token after KYC approval
 * @body { "sessionId": "...", "walletAddress": "...", "realName": "..." }
 */
app.post("/api/user/claim-share", async (req, res) => {
  try {
    const { sessionId, walletAddress, realName } = req.body;
    
    // Validate required fields
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }
    if (!realName) {
      return res.status(400).json({ error: "realName is required" });
    }

    // Dev Mode: Bypass KYC verification if DEV_MODE is enabled
    if (process.env.DEV_MODE === 'true') {
      console.log(`🔧 DEV MODE: Bypassing KYC verification for wallet: ${walletAddress}`);
    } else {
      // Check KYC verification status
      console.log(`Checking KYC verification status for session: ${sessionId}`);
      const verificationStatus = await checkVerificationStatus(sessionId);
      
      // Check if verification is approved
      if (verificationStatus !== "Approved") {
        return res.status(403).json({ 
          error: "KYC verification not complete", 
          status: verificationStatus,
          message: "Your KYC verification must be approved before claiming shares"
        });
      }

      console.log(`✅ KYC verified for wallet: ${walletAddress}`);
    }

    // Check if user already has tokens (prevent double-minting)
    const shareholderPublicKey = new PublicKey(walletAddress);
    const shareholderTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      authorityWallet,
      shareTokenMint,
      shareholderPublicKey
    );
    
    const tokenAccountInfo = await getAccount(connection, shareholderTokenAccount.address);
    if (tokenAccountInfo.amount > 0n) {
      return res.status(400).json({ 
        error: "Share tokens already minted for this wallet",
        tokenAccount: shareholderTokenAccount.address.toBase58(),
        existingAmount: tokenAccountInfo.amount.toString()
      });
    }

    // Mint 1 share token to the verified user
    console.log(`Minting 1 share token to ${walletAddress}...`);
    await mintTo(
      connection,
      authorityWallet,
      shareTokenMint,
      shareholderTokenAccount.address,
      authorityWallet,
      1
    );

    // Save user to Real Name Registry database
    const savedUser = addUser(walletAddress, realName, sessionId);
    console.log(`✅ User saved to Real Name Registry: ${realName} (${walletAddress})`);

    res.json({
      message: "Share token claimed successfully",
      tokenAccount: shareholderTokenAccount.address.toBase58(),
      amount: 1,
      walletAddress: walletAddress,
      realName: savedUser.realName,
      kycSessionId: savedUser.kycSessionId,
    });
  } catch (error) {
    console.error("Claim share error:", error);
    res.status(500).json({ 
      error: "Failed to claim share token", 
      details: error.message 
    });
  }
});

/**
 * @route POST /api/user/cast-vote
 * @desc Cast a vote (this will be called from frontend with wallet signature)
 * @body { "voteAccount": "...", "voteDirection": true/false, "voterWallet": "..." }
 * @note This endpoint prepares the transaction but the user must sign it from the frontend
 */
app.post("/api/user/cast-vote", async (req, res) => {
  try {
    const { voteAccount, voteDirection, voterWallet } = req.body;
    if (!voteAccount || voteDirection === undefined || !voterWallet) {
      return res.status(400).json({
        error: "voteAccount, voteDirection, and voterWallet are required",
      });
    }

    const voteAccountPubkey = new PublicKey(voteAccount);
    const voterPubkey = new PublicKey(voterWallet);

    // Get voter's token account
    const voterTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      authorityWallet,
      shareTokenMint,
      voterPubkey
    );

    // Check if voter has tokens
    const tokenAccountInfo = await getAccount(connection, voterTokenAccount.address);
    if (tokenAccountInfo.amount < 1n) {
      return res.status(400).json({ error: "Insufficient share tokens to vote" });
    }

    // Generate PDA for vote receipt
    const [voteReceipt] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("receipt"),
        voteAccountPubkey.toBuffer(),
        voterPubkey.toBuffer(),
      ],
      program.programId
    );

    // Build the transaction
    const tx = await program.methods
      .castVote(voteDirection)
      .accounts({
        voteAccount: voteAccountPubkey,
        voteReceipt: voteReceipt,
        voter: voterPubkey,
        voterTokenAccount: voterTokenAccount.address,
        tokenMint: shareTokenMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    // Note: In a real implementation, the user would sign this transaction
    // from the frontend. For now, we return the transaction details.
    res.json({
      message: "Transaction prepared. User must sign from frontend.",
      transaction: tx,
      voteReceipt: voteReceipt.toBase58(),
    });
  } catch (error) {
    console.error("Failed to cast vote:", error);
    res.status(500).json({ error: "Failed to cast vote", details: error.message });
  }
});

// ===============================================
// --- DELEGATION ENDPOINTS ---
// ===============================================

/**
 * @route POST /api/user/delegate
 * @desc Set or update a delegate for voting rights
 * @body { "ownerWallet": "...", "delegateWallet": "..." }
 */
app.post("/api/user/delegate", async (req, res) => {
  try {
    const { ownerWallet, delegateWallet } = req.body;
    if (!ownerWallet || !delegateWallet) {
      return res.status(400).json({
        error: "ownerWallet and delegateWallet are required",
      });
    }

    const ownerPubkey = new PublicKey(ownerWallet);
    const delegatePubkey = new PublicKey(delegateWallet);

    // Derive the delegation PDA
    const delegationPDA = getDelegationPDA(ownerPubkey, shareTokenMint);

    // Build the transaction
    const tx = await program.methods
      .setDelegate(delegatePubkey)
      .accounts({
        delegation: delegationPDA,
        authority: ownerPubkey,
        mint: shareTokenMint,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    res.json({
      message: "Transaction prepared. User must sign from frontend.",
      transaction: tx,
      delegationPDA: delegationPDA.toBase58(),
    });
  } catch (error) {
    console.error("Failed to set delegate:", error);
    res.status(500).json({ error: "Failed to set delegate", details: error.message });
  }
});

/**
 * @route POST /api/user/cast-proxy-vote
 * @desc Cast a proxy vote on behalf of an owner
 * @body { "voteAccount": "...", "voteDirection": boolean, "delegateWallet": "...", "ownerWallet": "..." }
 */
app.post("/api/user/cast-proxy-vote", async (req, res) => {
  try {
    const { voteAccount, voteDirection, delegateWallet, ownerWallet } = req.body;
    if (!voteAccount || voteDirection === undefined || !delegateWallet || !ownerWallet) {
      return res.status(400).json({
        error: "voteAccount, voteDirection, delegateWallet, and ownerWallet are required",
      });
    }

    const voteAccountPubkey = new PublicKey(voteAccount);
    const delegatePubkey = new PublicKey(delegateWallet);
    const ownerPubkey = new PublicKey(ownerWallet);

    // Derive delegationRecord PDA using Owner's wallet and shareTokenMint
    const delegationRecordPDA = getDelegationPDA(ownerPubkey, shareTokenMint);

    // Derive voteReceipt PDA using Owner's wallet (not delegate's) and voteAccount
    const [voteReceiptPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("receipt"),
        voteAccountPubkey.toBuffer(),
        ownerPubkey.toBuffer(),
      ],
      program.programId
    );

    // Get Owner's token account
    const ownerTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      authorityWallet,
      shareTokenMint,
      ownerPubkey
    );

    // Build the transaction
    const tx = await program.methods
      .castProxyVote(voteDirection)
      .accounts({
        voteAccount: voteAccountPubkey,
        delegationRecord: delegationRecordPDA,
        ownerTokenAccount: ownerTokenAccount.address,
        delegate: delegatePubkey,
        voteReceipt: voteReceiptPDA,
        tokenMint: shareTokenMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    res.json({
      message: "Transaction prepared. Delegate must sign from frontend.",
      transaction: tx,
      voteReceipt: voteReceiptPDA.toBase58(),
    });
  } catch (error) {
    console.error("Failed to cast proxy vote:", error);
    res.status(500).json({ error: "Failed to cast proxy vote", details: error.message });
  }
});

/**
 * @route GET /api/user/delegation/:walletAddress
 * @desc Get delegation status for a wallet
 * @param {string} walletAddress - The wallet address to check
 */
app.get("/api/user/delegation/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    const ownerPubkey = new PublicKey(walletAddress);

    // Derive delegation PDA for this wallet
    const delegationPDA = getDelegationPDA(ownerPubkey, shareTokenMint);

    try {
      // Try to fetch the delegation account
      const delegationAccount = await program.account.delegation.fetch(delegationPDA);
      
      res.json({
        isDelegating: true,
        delegate: delegationAccount.delegate.toBase58(),
        owner: delegationAccount.owner.toBase58(),
        mint: delegationAccount.mint.toBase58(),
      });
    } catch (fetchError) {
      // Account doesn't exist, so no delegation
      res.json({
        isDelegating: false,
      });
    }
  } catch (error) {
    console.error("Failed to get delegation status:", error);
    res.status(500).json({ error: "Failed to get delegation status", details: error.message });
  }
});

/**
 * @route POST /api/user/revoke-delegate
 * @desc Revoke delegation and close the delegation account
 * @body { "ownerWallet": "..." }
 */
app.post("/api/user/revoke-delegate", async (req, res) => {
  try {
    const { ownerWallet } = req.body;
    if (!ownerWallet) {
      return res.status(400).json({
        error: "ownerWallet is required",
      });
    }

    const ownerPubkey = new PublicKey(ownerWallet);

    // Derive the delegation PDA
    const delegationPDA = getDelegationPDA(ownerPubkey, shareTokenMint);

    // Build the transaction
    const tx = await program.methods
      .revokeDelegation()
      .accounts({
        delegation: delegationPDA,
        authority: ownerPubkey,
        mint: shareTokenMint,
      })
      .transaction();

    res.json({
      message: "Transaction prepared. User must sign from frontend.",
      transaction: tx,
      delegationPDA: delegationPDA.toBase58(),
    });
  } catch (error) {
    console.error("Failed to revoke delegation:", error);
    res.status(500).json({ error: "Failed to revoke delegation", details: error.message });
  }
});

// ===============================================
// --- LEGACY ENDPOINTS (for backward compatibility) ---
// ===============================================

app.post("/create-token", async (req, res) => {
  // Redirect to new endpoint
  req.url = "/api/company/create-token";
  app._router.handle(req, res);
});

app.post("/mint-share", async (req, res) => {
  // Redirect to new endpoint
  req.url = "/api/company/mint-share";
  app._router.handle(req, res);
});

app.post("/initialize-vote", async (req, res) => {
  // Redirect to new endpoint
  req.url = "/api/company/create-vote";
  app._router.handle(req, res);
});

  // --- 5. START THE SERVER ---
  app.listen(PORT, () => {
    console.log(`✅ Backend server running at http://localhost:${PORT}`);
    console.log(`   Cluster: ${cluster}`);
    console.log(`   Program ID: ${programId.toBase58()}`);
    console.log(`   Share Token Mint: ${shareTokenMint.toBase58()}`);
  });
}
