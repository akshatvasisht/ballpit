// Third-party
const express = require("express");
const { PublicKey, SystemProgram } = require("@solana/web3.js");
const {
    getOrCreateAssociatedTokenAccount,
    getAccount,
    mintTo,
    TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");

// Local modules
const solanaService = require("../services/solanaService");
const { checkVerificationStatus } = require("../services/kycService");
const { addUser } = require("../db");
const { validate, schemas } = require("./schemas");

const router = express.Router();

/**
 * @route GET /api/user/votes
 * @desc Get all available vote proposals created by the company authority.
 * @returns {Promise<{votes: Array}>}
 */
router.get("/votes", async (req, res, next) => {
    try {
        const voteAccounts = await solanaService.program.account.voteAccount.all();
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
        next(error);
    }
});

/**
 * @route GET /api/user/vote/:voteAccount
 * @desc Get detailed information about a specific vote proposal.
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
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/user/claim-share
 * @desc Verifies KYC status and mints initial share token to user wallet.
 * @body {string} sessionId - KYC verification session ID
 * @body {string} walletAddress - The user's Solana wallet address
 * @body {string} realName - The user's proven real name
 * @returns {Promise<{message: string}>}
 */
router.post("/claim-share", validate(schemas.claimShare), async (req, res, next) => {
    try {
        const { sessionId, walletAddress, realName } = req.body;

        if (process.env.DEV_MODE !== 'true') {
            const status = await checkVerificationStatus(sessionId);
            if (status !== "Approved") {
                const error = new Error("KYC not approved");
                error.status = 403;
                error.code = "KYC_UNAUTHORIZED";
                throw error;
            }
        }

        const shareholderPublicKey = new PublicKey(walletAddress);
        const shareholderTokenAccount = await getOrCreateAssociatedTokenAccount(
            solanaService.connection,
            solanaService.authorityWallet,
            solanaService.shareTokenMint,
            shareholderPublicKey
        );

        const tokenAccountInfo = await getAccount(solanaService.connection, shareholderTokenAccount.address);
        if (tokenAccountInfo.amount > 0n) {
            const error = new Error("Tokens already claimed");
            error.status = 400;
            error.code = "ALREADY_CLAIMED";
            throw error;
        }

        await mintTo(
            solanaService.connection,
            solanaService.authorityWallet,
            solanaService.shareTokenMint,
            shareholderTokenAccount.address,
            solanaService.authorityWallet,
            1
        );

        addUser(walletAddress, realName, sessionId);
        res.json({ message: "Token claimed successfully" });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/user/cast-vote
 * @desc Prepare a transaction for casting a vote on a proposal.
 * @body {string} voteAccount - The proposal account public key
 * @body {boolean} voteDirection - true for "for", false for "against"
 * @body {string} voterWallet - The voter's Solana wallet address
 * @returns {Promise<{message: string, transaction: object, voteReceipt: string}>}
 */
router.post("/cast-vote", validate(schemas.castVote), async (req, res, next) => {
    try {
        const { voteAccount, voteDirection, voterWallet } = req.body;
        const voteAccountPubkey = new PublicKey(voteAccount);
        const voterPubkey = new PublicKey(voterWallet);

        const voterTokenAccount = await getOrCreateAssociatedTokenAccount(
            solanaService.connection,
            solanaService.authorityWallet,
            solanaService.shareTokenMint,
            voterPubkey
        );

        const voteReceipt = solanaService.getVoteReceiptPDA(voteAccountPubkey, voterPubkey);

        const tx = await solanaService.program.methods
            .castVote(voteDirection)
            .accounts({
                voteAccount: voteAccountPubkey,
                voteReceipt: voteReceipt,
                voter: voterPubkey,
                voterTokenAccount: voterTokenAccount.address,
                tokenMint: solanaService.shareTokenMint,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            });

        // Administrative authority bypass for demo execution
        if (voterWallet === solanaService.authorityWallet.publicKey.toBase58()) {
            console.log("Demo Mode: Auto-signing for authority wallet...");

            // Check if authority has tokens, mint if not (just to be sure)
            const tokenAccountInfo = await getAccount(solanaService.connection, voterTokenAccount.address);
            if (tokenAccountInfo.amount === 0n) {
                console.log("Demo Mode: Minting 1 share token to authority...");
                await mintTo(
                    solanaService.connection,
                    solanaService.authorityWallet,
                    solanaService.shareTokenMint,
                    voterTokenAccount.address,
                    solanaService.authorityWallet,
                    1
                );
            }

            const signature = await tx.signers([solanaService.authorityWallet]).rpc();
            return res.json({
                message: "Vote cast successfully via Demo Mode",
                signature,
                voteReceipt: voteReceipt.toBase58()
            });
        }

        // Standard transaction preparation for client-side signing
        const builtTx = await tx.transaction();
        res.json({ message: "Transaction prepared", transaction: builtTx, voteReceipt: voteReceipt.toBase58() });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/user/delegate
 * @desc Prepare a transaction for delegating voting rights.
 * @body {string} ownerWallet - The token holder's wallet address
 * @returns {Promise<{transaction: object, delegationPDA: string}>}
 */
router.post("/delegate", validate(schemas.delegate), async (req, res, next) => {
    try {
        const { ownerWallet, delegateWallet } = req.body;
        const ownerPubkey = new PublicKey(ownerWallet);
        const delegatePubkey = new PublicKey(delegateWallet);
        const delegationPDA = solanaService.getDelegationPDA(ownerPubkey);

        const tx = await solanaService.program.methods
            .setDelegate(delegatePubkey)
            .accounts({
                delegation: delegationPDA,
                authority: ownerPubkey,
                mint: solanaService.shareTokenMint,
                systemProgram: SystemProgram.programId,
            })
            .transaction();

        res.json({ transaction: tx, delegationPDA: delegationPDA.toBase58() });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/user/cast-proxy-vote
 * @desc Prepare a transaction for casting a vote as a delegate.
 * @body {string} voteAccount - The proposal account public key
 * @body {boolean} voteDirection - true for "for", false for "against"
 * @body {string} delegateWallet - The delegate's wallet address
 * @body {string} ownerWallet - The original token owner's wallet address
 * @returns {Promise<{message: string, transaction: object, voteReceipt: string}>}
 */
router.post("/cast-proxy-vote", validate(schemas.castProxyVote), async (req, res, next) => {
    try {
        const { voteAccount, voteDirection, delegateWallet, ownerWallet } = req.body;
        const voteAccountPubkey = new PublicKey(voteAccount);
        const delegatePubkey = new PublicKey(delegateWallet);
        const ownerPubkey = new PublicKey(ownerWallet);

        const delegationRecordPDA = solanaService.getDelegationPDA(ownerPubkey);
        const voteReceiptPDA = solanaService.getVoteReceiptPDA(voteAccountPubkey, ownerPubkey);

        const ownerTokenAccount = await getOrCreateAssociatedTokenAccount(
            solanaService.connection,
            solanaService.authorityWallet,
            solanaService.shareTokenMint,
            ownerPubkey
        );

        const tx = await solanaService.program.methods
            .castProxyVote(voteDirection)
            .accounts({
                voteAccount: voteAccountPubkey,
                delegationRecord: delegationRecordPDA,
                ownerTokenAccount: ownerTokenAccount.address,
                delegate: delegatePubkey,
                voteReceipt: voteReceiptPDA,
                tokenMint: solanaService.shareTokenMint,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .transaction();

        res.json({ message: "Transaction prepared", transaction: tx, voteReceipt: voteReceiptPDA.toBase58() });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/user/delegation/:walletAddress
 * @desc Get current delegation status and details for a wallet.
 * @param {string} walletAddress - The owner wallet to check
 * @returns {Promise<{isDelegating: boolean, delegate?: string, owner?: string, mint?: string}>}
 */
router.get("/delegation/:walletAddress", async (req, res, next) => {
    try {
        const { walletAddress } = req.params;
        const ownerPubkey = new PublicKey(walletAddress);
        const delegationPDA = solanaService.getDelegationPDA(ownerPubkey);

        try {
            const delegationAccount = await solanaService.program.account.delegation.fetch(delegationPDA);
            res.json({
                isDelegating: true,
                delegate: delegationAccount.delegate.toBase58(),
                owner: delegationAccount.owner.toBase58(),
                mint: delegationAccount.mint.toBase58(),
            });
        } catch (e) {
            // No delegation found is a normal flow, not a 500
            res.json({ isDelegating: false });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/user/revoke-delegate
 * @desc Prepare a transaction for revoking previously granted voting rights.
 * @body {string} ownerWallet - The original token owner's wallet address
 * @returns {Promise<{transaction: object, delegationPDA: string}>}
 */
router.post("/revoke-delegate", validate(schemas.revokeDelegate), async (req, res, next) => {
    try {
        const { ownerWallet } = req.body;
        const ownerPubkey = new PublicKey(ownerWallet);
        const delegationPDA = solanaService.getDelegationPDA(ownerPubkey);

        const tx = await solanaService.program.methods
            .revokeDelegation()
            .accounts({
                delegation: delegationPDA,
                authority: ownerPubkey,
                mint: solanaService.shareTokenMint,
            })
            .transaction();

        res.json({ transaction: tx, delegationPDA: delegationPDA.toBase58() });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
