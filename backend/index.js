const express = require("express");
const cors = require("cors");
const {
  Connection,
  PublicKey,
  Keypair,
  clusterApiUrl,
  SystemProgram, // <-- We need this
} = require("@solana/web3.js");
const { getOrCreateAssociatedTokenAccount, createMint, mintTo } = require("@solana/spl-token");
const anchor = require("@coral-xyz/anchor");
const fs = require("fs");
require("dotenv").config();

// --- 1. SETUP UP THE SERVER ---
const app = express();
app.use(cors());
app.use(express.json());
const PORT = 3001;

// --- 2. CONNECT TO SOLANA & LOAD WALLET ---
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const privateKey = JSON.parse(process.env.PRIVATE_KEY);
const authorityWallet = Keypair.fromSecretKey(new Uint8Array(privateKey));
console.log("Backend Authority Wallet:", authorityWallet.publicKey.toBase58());

// --- 3. HARDCODE OUR TOKEN AND PROGRAM ---

// This is the "share token" you created
let shareTokenMint = new PublicKey("4tbkoExLHa9j62vCshizth9HdQjvyDpSeMnto2DmnMh7");

// This is your smart contract's address on devnet
const programId = new PublicKey("5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4");

// --- 4. LOAD THE ANCHOR PROGRAM ---

// Load the IDL (the "manual") from the file we copied
const idl = JSON.parse(fs.readFileSync("./idl.json", "utf8"));

// Create the "Anchor Provider"
const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(authorityWallet), {
  preflightCommitment: "confirmed",
  commitment: "confirmed",
});

// Create the Program object
const program = new anchor.Program(idl, programId, provider);
console.log(`✅ Loaded Smart Contract: ${program.programId.toBase58()}`);

// ===============================================
// --- ENDPOINTS ---
// ===============================================

/**
 * @route POST /create-token
 * @desc We already ran this, but we'll leave it here.
 */
app.post("/create-token", async (req, res) => {
  try {
    console.log("Creating our company's 'Share Token' on devnet...");
    const mint = await createMint(connection, authorityWallet, authorityWallet.publicKey, authorityWallet.publicKey, 0);
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
 * @route POST /mint-share
 * @desc Mints 1 "share token" to a shareholder.
 * @body { "shareholderWallet": "..." }
 */
app.post("/mint-share", async (req, res) => {
  try {
    const { shareholderWallet } = req.body;
    if (!shareholderWallet) return res.status(400).json({ error: "Shareholder wallet is required" });

    const shareholderPublicKey = new PublicKey(shareholderWallet);
    console.log(`Minting 1 share to ${shareholderWallet}...`);

    const shareholderTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      authorityWallet,
      shareTokenMint,
      shareholderPublicKey
    );
    await mintTo(connection, authorityWallet, shareTokenMint, shareholderTokenAccount.address, authorityWallet, 1);

    res.json({
      message: "Share token minted successfully",
      tokenAccount: shareholderTokenAccount.address.toBase58(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to mint token" });
  }
});

/**
 * @route POST /initialize-vote
 * @desc Creates a new "Ballot Box" (VoteAccount) on the smart contract.
 * @body { "title": "..." }
 */
app.post("/initialize-vote", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Vote title is required" });
    }

    // 1. Generate a new keypair for the "Ballot Box" account
    const voteAccount = Keypair.generate();
    console.log(`New Vote Account (Ballot Box) Pubkey: ${voteAccount.publicKey.toBase58()}`);

    // 2. Call our smart contract's `initializeVote` instruction
    const tx = await program.methods
      .initializeVote(title, shareTokenMint) // Pass in the title and the token mint
      .accounts({
        voteAccount: voteAccount.publicKey,
        authority: authorityWallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authorityWallet, voteAccount]) // We need two signers
      .rpc();

    console.log("✅ New Vote Created! Transaction signature:", tx);
    res.json({
      message: "Vote created successfully",
      voteAccount: voteAccount.publicKey.toBase58(),
      transaction: tx,
    });
  } catch (error) {
    console.error("Failed to initialize vote:", error);
    res.status(500).json({ error: "Failed to initialize vote" });
  }
});

// --- 5. START THE SERVER ---
app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});