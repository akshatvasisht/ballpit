const { z } = require("zod");

// Helper to validate Solana public keys
const solanaPubKey = z.string().refine((val) => {
    try {
        const { PublicKey } = require("@solana/web3.js");
        new PublicKey(val);
        return true;
    } catch {
        return false;
    }
}, { message: "Invalid Solana public key" });

const schemas = {
    // KYC Routes
    kycVerify: z.object({
        walletAddress: solanaPubKey,
    }),

    // Company Routes
    mintShare: z.object({
        shareholderWallet: solanaPubKey,
        amount: z.number().int().positive().optional(),
    }),

    batchMint: z.object({
        mints: z.array(z.object({
            wallet: solanaPubKey,
            amount: z.number().int().positive().optional(),
        })),
    }),

    createVote: z.object({
        title: z.string().min(3).max(100),
    }),

    closeVote: z.object({
        voteAccount: solanaPubKey,
    }),

    // User Routes
    claimShare: z.object({
        sessionId: z.string().uuid(),
        walletAddress: solanaPubKey,
        realName: z.string().min(2).max(100),
    }),

    castVote: z.object({
        voteAccount: solanaPubKey,
        voteDirection: z.boolean(),
        voterWallet: solanaPubKey,
    }),

    delegate: z.object({
        ownerWallet: solanaPubKey,
        delegateWallet: solanaPubKey,
    }),

    castProxyVote: z.object({
        voteAccount: solanaPubKey,
        voteDirection: z.boolean(),
        delegateWallet: solanaPubKey,
        ownerWallet: solanaPubKey,
    }),

    revokeDelegate: z.object({
        ownerWallet: solanaPubKey,
    }),
};

/**
 * Middleware to validate request body against a schema
 */
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: "Validation failed",
                details: error.issues.map(e => ({ path: e.path, message: e.message }))
            });
        }
        return res.status(500).json({ error: "Internal validation error", details: error.message });
    }
};

module.exports = { schemas, validate };
