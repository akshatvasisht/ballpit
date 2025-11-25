const {
    Connection,
    PublicKey,
    Keypair,
    clusterApiUrl,
} = require("@solana/web3.js");
const anchor = require("@coral-xyz/anchor");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

class SolanaService {
    /**
     * Initializes the Solana service with connection and authority wallet.
     * Loads environment variables for cluster, programId, and shareTokenMint.
     */
    constructor() {
        this.cluster = process.env.SOLANA_CLUSTER || "devnet";
        this.connection = new Connection(clusterApiUrl(this.cluster), "confirmed");
        this.programId = new PublicKey(
            process.env.PROGRAM_ID || "5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4"
        );
        this.shareTokenMint = new PublicKey(
            process.env.SHARE_TOKEN_MINT || "4tbkoExLHa9j62vCshizth9HdQjvyDpSeMnto2DmnMh7"
        );

        if (!process.env.PRIVATE_KEY) {
            throw new Error("PRIVATE_KEY environment variable is required");
        }

        const privateKey = JSON.parse(process.env.PRIVATE_KEY);
        this.authorityWallet = Keypair.fromSecretKey(new Uint8Array(privateKey));

        this.provider = new anchor.AnchorProvider(
            this.connection,
            new anchor.Wallet(this.authorityWallet),
            {
                preflightCommitment: "confirmed",
                commitment: "confirmed",
            }
        );

        anchor.setProvider(this.provider);
        this.program = null;
    }

    /**
     * Initializes the Anchor program by loading the IDL from the local filesystem.
     * MUST be called before any program-dependent methods are used.
     * 
     * @returns {Promise<void>}
     * @throws {Error} If IDL file is missing or program initialization fails
     */
    async init() {
        try {
            console.log("Loading IDL from local file...");
            const idlPath = path.join(__dirname, "../idl.json");

            if (!fs.existsSync(idlPath)) {
                throw new Error(`IDL file not found at ${idlPath}. Please ensure it is present.`);
            }

            const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));

            // In Anchor 0.30+, the program Id is often embedded in the IDL metadata or passed as second arg
            this.program = new anchor.Program(idl, this.provider);
            console.log(`Initialized Anchor Program with ID: ${this.program.programId.toBase58()}`);

        } catch (error) {
            console.error("Failed to initialize Solana service:", error.message);
            throw error; // Let the app crash or handle it at top level if core service fails
        }
    }

    /**
     * Derives the Program Derived Address (PDA) for a delegation record.
     * 
     * @param {PublicKey} ownerPubkey - The public key of the token owner
     * @returns {PublicKey} The derived delegation PDA
     */
    getDelegationPDA(ownerPubkey) {
        const [delegationPDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("delegation"),
                ownerPubkey.toBuffer(),
                this.shareTokenMint.toBuffer(),
            ],
            this.programId
        );
        return delegationPDA;
    }

    /**
     * Derives the Program Derived Address (PDA) for a individual vote receipt.
     * 
     * @param {PublicKey} voteAccountPubkey - The proposal account public key
     * @param {PublicKey} voterPubkey - The public key of the voter (owner)
     * @returns {PublicKey} The derived vote receipt PDA
     */
    getVoteReceiptPDA(voteAccountPubkey, voterPubkey) {
        const [voteReceipt] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("receipt"),
                voteAccountPubkey.toBuffer(),
                voterPubkey.toBuffer(),
            ],
            this.programId
        );
        return voteReceipt;
    }
}

module.exports = new SolanaService();
