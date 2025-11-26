// Third-party
const express = require("express");
const { PublicKey, SystemProgram, Keypair } = require("@solana/web3.js");
const {
    createMint,
    mintTo,
    getOrCreateAssociatedTokenAccount,
    getMint,
} = require("@solana/spl-token");
const anchor = require("@coral-xyz/anchor");

// Local modules
const solanaService = require("../services/solanaService");
const { requireAdmin } = require("./middleware");
const { getAllUsers, getUserByWallet } = require("../db");
const { validate, schemas } = require("./schemas");

const router = express.Router();

/**
 * @route POST /api/company/create-token
 * @desc Create a new share token for the company
 */
router.post("/create-token", requireAdmin, async (req, res, next) => {
    try {
        console.log("Creating company's 'Share Token'...");
        const mint = await createMint(
            solanaService.connection,
            solanaService.authorityWallet,
            solanaService.authorityWallet.publicKey,
            solanaService.authorityWallet.publicKey,
            0
        );
        console.log("Share Token Created:", mint.toBase58());
        res.json({
            message: "Token created successfully",
            tokenMint: mint.toBase58(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/company/mint-share
 * @desc Mint share tokens to a verified shareholder
 */
router.post("/mint-share", requireAdmin, validate(schemas.mintShare), async (req, res, next) => {
    try {
        const { shareholderWallet, amount = 1 } = req.body;

        const shareholderPublicKey = new PublicKey(shareholderWallet);
        const shareholderTokenAccount = await getOrCreateAssociatedTokenAccount(
            solanaService.connection,
            solanaService.authorityWallet,
            solanaService.shareTokenMint,
            shareholderPublicKey
        );

        await mintTo(
            solanaService.connection,
            solanaService.authorityWallet,
            solanaService.shareTokenMint,
            shareholderTokenAccount.address,
            solanaService.authorityWallet,
            amount
        );

        res.json({
            message: "Share token minted successfully",
            tokenAccount: shareholderTokenAccount.address.toBase58(),
            amount,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/company/batch-mint
 * @desc Batch mint tokens to multiple shareholders
 */
router.post("/batch-mint", requireAdmin, validate(schemas.batchMint), async (req, res, next) => {
    try {
        const { mints } = req.body;
        const results = [];

        for (const mint of mints) {
            try {
                const shareholderPublicKey = new PublicKey(mint.wallet);
                const shareholderTokenAccount = await getOrCreateAssociatedTokenAccount(
                    solanaService.connection,
                    solanaService.authorityWallet,
                    solanaService.shareTokenMint,
                    shareholderPublicKey
                );

                await mintTo(
                    solanaService.connection,
                    solanaService.authorityWallet,
                    solanaService.shareTokenMint,
                    shareholderTokenAccount.address,
                    solanaService.authorityWallet,
                    mint.amount || 1
                );
                results.push({ wallet: mint.wallet, status: "success" });
            } catch (err) {
                results.push({ wallet: mint.wallet, status: "failed", error: err.message });
            }
        }

        res.json({ message: "Batch mint completed", results });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/company/create-vote
 * @desc Create a new vote (Ballot Box)
 */
router.post("/create-vote", requireAdmin, validate(schemas.createVote), async (req, res, next) => {
    try {
        const { title } = req.body;

        const voteAccount = Keypair.generate();
        const tx = await solanaService.program.methods
            .initializeVote(title, solanaService.shareTokenMint)
            .accounts({
                voteAccount: voteAccount.publicKey,
                authority: solanaService.authorityWallet.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([solanaService.authorityWallet, voteAccount])
            .rpc();

        res.json({
            message: "Vote created successfully",
            voteAccount: voteAccount.publicKey.toBase58(),
            transaction: tx,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/company/votes
 * @desc Get all votes created by the company authority with participation metrics.
 * @returns {Promise<{votes: Array}>}
 */
router.get("/votes", async (req, res, next) => {
    try {
        const mintInfo = await getMint(solanaService.connection, solanaService.shareTokenMint);
        const totalSupply = Number(mintInfo.supply);

        const voteAccounts = await solanaService.program.account.voteAccount.all([
            {
                memcmp: {
                    offset: 8,
                    bytes: solanaService.authorityWallet.publicKey.toBase58()
                }
            }
        ]);

        const votes = voteAccounts.map(({ publicKey, account }) => {
            const votesFor = Number(account.votesFor.toString());
            const votesAgainst = Number(account.votesAgainst.toString());
            const totalVotesCast = votesFor + votesAgainst;
            let participationRate = "0.00%";
            if (totalSupply > 0) {
                participationRate = ((totalVotesCast / totalSupply) * 100).toFixed(2) + "%";
            }

            return {
                voteAccount: publicKey.toBase58(),
                title: account.title,
                votesFor: account.votesFor.toString(),
                votesAgainst: account.votesAgainst.toString(),
                totalVotes: totalVotesCast,
                participationRate,
                totalSupply,
                isActive: account.isActive,
                authority: account.authority.toBase58(),
                tokenMint: account.tokenMint.toBase58(),
            };
        });

        res.json({ votes });
    } catch (error) {
        console.error("Error in /api/company/votes:", error);
        next(error);
    }
});

/**
 * @route GET /api/company/vote/:voteAccount
 * @desc Get metadata and vote counts for a specific proposal.
 * @param {string} voteAccount - The proposal account public key
 * @returns {Promise<object>}
 */
router.get("/vote/:voteAccount", async (req, res, next) => {
    try {
        const { voteAccount } = req.params;
        const voteAccountPubkey = new PublicKey(voteAccount);
        const voteAccountData = await solanaService.program.account.voteAccount.fetch(voteAccountPubkey);

        res.json({
            voteAccount,
            title: voteAccountData.title,
            isActive: voteAccountData.isActive,
            votesFor: voteAccountData.votesFor.toString(),
            votesAgainst: voteAccountData.votesAgainst.toString(),
            tokenMint: voteAccountData.tokenMint.toBase58(),
            authority: voteAccountData.authority.toBase58(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/company/close-vote
 * @desc Finalize a voting process, preventing any further votes on-chain.
 * @headers {string} x-admin-key - Admin authorization
 * @body {string} voteAccount - The proposal account public key
 * @returns {Promise<{message: string, transaction: string}>}
 */
router.post("/close-vote", requireAdmin, validate(schemas.closeVote), async (req, res, next) => {
    try {
        const { voteAccount } = req.body;

        const voteAccountPubkey = new PublicKey(voteAccount);
        const tx = await solanaService.program.methods
            .closeVote()
            .accounts({
                voteAccount: voteAccountPubkey,
                authority: solanaService.authorityWallet.publicKey,
            })
            .rpc();

        res.json({ message: "Vote closed successfully", transaction: tx });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/company/shareholders
 * @desc Retrieve the full list of shareholders from the Real Name Registry.
 * @headers {string} x-admin-key - Admin authorization
 * @returns {Promise<{shareholders: Array}>}
 */
router.get("/shareholders", requireAdmin, async (req, res, next) => {
    try {
        const users = getAllUsers();
        res.json({ shareholders: users });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/company/vote-details/:voteAccount
 * @desc Audit endpoint to retrieve individual vote directions linked to real names.
 * @headers {string} x-admin-key - Admin authorization
 * @param {string} voteAccount - The proposal account public key
 * @returns {Promise<{voteDetails: Array}>}
 */
router.get("/vote-details/:voteAccount", requireAdmin, async (req, res, next) => {
    try {
        const { voteAccount } = req.params;
        const voteAccountPubkey = new PublicKey(voteAccount);

        const voteReceipts = await solanaService.program.account.voteReceipt.all([
            {
                memcmp: {
                    offset: 40,
                    bytes: voteAccountPubkey.toBase58(),
                },
            },
        ]);

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
        next(error);
    }
});

module.exports = router;
