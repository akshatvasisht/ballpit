const request = require("supertest");
const app = require("../app");

// Helper to create a chainable mock for Anchor methods
const createChainableMock = () => {
    const mock = {
        accounts: jest.fn().mockReturnThis(),
        signers: jest.fn().mockReturnThis(),
        remainingAccounts: jest.fn().mockReturnThis(),
        preInstructions: jest.fn().mockReturnThis(),
        postInstructions: jest.fn().mockReturnThis(),
        rpc: jest.fn().mockResolvedValue("mock-tx-signature"),
        transaction: jest.fn().mockResolvedValue({}),
        view: jest.fn().mockResolvedValue({}),
    };
    return mock;
};

// Mocking the solana service
jest.mock("../services/solanaService", () => {
    const { PublicKey } = require("@solana/web3.js");
    return {
        init: jest.fn().mockResolvedValue(true),
        cluster: "testnet",
        connection: {
            getLatestBlockhash: jest.fn().mockResolvedValue({ blockhash: "mock-blockhash", lastValidBlockHeight: 100 }),
        },
        authorityWallet: {
            publicKey: new PublicKey("5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4")
        },
        programId: new PublicKey("5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4"),
        shareTokenMint: new PublicKey("4tbkoExLHa9j62vCshizth9HdQjvyDpSeMnto2DmnMh7"),
        getDelegationPDA: jest.fn().mockReturnValue(new PublicKey("5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4")),
        getVoteReceiptPDA: jest.fn().mockReturnValue(new PublicKey("5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4")),
        program: {
            methods: {
                initializeVote: jest.fn().mockImplementation(createChainableMock),
                castVote: jest.fn().mockImplementation(createChainableMock),
                setDelegate: jest.fn().mockImplementation(createChainableMock),
                castProxyVote: jest.fn().mockImplementation(createChainableMock),
                closeVote: jest.fn().mockImplementation(createChainableMock),
                revokeDelegation: jest.fn().mockImplementation(createChainableMock),
            },
            account: {
                voteAccount: {
                    all: jest.fn().mockResolvedValue([]),
                    fetch: jest.fn().mockResolvedValue({
                        title: "Mock Vote",
                        isActive: true,
                        votesFor: { toString: () => "10" },
                        votesAgainst: { toString: () => "5" },
                        tokenMint: new PublicKey("4tbkoExLHa9j62vCshizth9HdQjvyDpSeMnto2DmnMh7"),
                        authority: new PublicKey("5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4"),
                    }),
                },
                voteReceipt: {
                    all: jest.fn().mockResolvedValue([]),
                },
                delegation: {
                    fetch: jest.fn().mockResolvedValue({
                        delegate: new PublicKey("5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4"),
                        owner: new PublicKey("5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4"),
                        mint: new PublicKey("4tbkoExLHa9j62vCshizth9HdQjvyDpSeMnto2DmnMh7"),
                    }),
                },
            },
        },
    };
});

// Mocking database
jest.mock("../db", () => ({
    getUserByWallet: jest.fn().mockReturnValue(null),
    getAllUsers: jest.fn().mockReturnValue([]),
    addUser: jest.fn().mockReturnValue({ realName: "Test User", walletAddress: "test-wallet", kycSessionId: "test-session" }),
}));

// Mocking SPL Token functions
jest.mock("@solana/spl-token", () => ({
    getOrCreateAssociatedTokenAccount: jest.fn().mockResolvedValue({ address: { toBase58: () => "mock-ata" } }),
    mintTo: jest.fn().mockResolvedValue("mock-mint-tx"),
    createMint: jest.fn().mockResolvedValue({ toBase58: () => "mock-mint" }),
    getMint: jest.fn().mockResolvedValue({ supply: 100n }),
    getAccount: jest.fn().mockResolvedValue({ amount: 0n }),
    TOKEN_PROGRAM_ID: { toBase58: () => "TokenkegQfeZyiNwAJbVNBH4DQ3To" },
}));

// Mocking kycService
jest.mock("../services/kycService", () => ({
    createVerificationSession: jest.fn().mockResolvedValue({ url: "http://mock.url", session_id: "mock-session" }),
    checkVerificationStatus: jest.fn().mockResolvedValue("Approved"),
}));

describe("API Integration Tests", () => {
    describe("Basic Endpoints", () => {
        test("GET /health should return ok", async () => {
            const response = await request(app).get("/health");
            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchObject({ status: "ok" });
            expect(response.body).toHaveProperty("requestId");
        });
    });

    describe("KYC Endpoints", () => {
        test("POST /api/kyc/verify should return session details", async () => {
            const response = await request(app)
                .post("/api/kyc/verify")
                .send({ walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" });
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("sessionId");
            expect(response.body).toHaveProperty("verificationUrl");
        });

        test("GET /api/kyc/status/:sessionId should return status", async () => {
            const response = await request(app).get("/api/kyc/status/550e8400-e29b-41d4-a716-446655440000");
            expect(response.statusCode).toBe(200);
            expect(response.body.status).toBe("Approved");
        });
    });

    describe("Admin Endpoints", () => {
        const adminKey = process.env.ADMIN_KEY || "test-admin-key";

        test("POST /api/company/create-token should succeed with valid admin key", async () => {
            const response = await request(app)
                .post("/api/company/create-token")
                .set("x-admin-key", adminKey);
            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Token created successfully");
        });

        test("POST /api/company/create-token should fail without admin key", async () => {
            const response = await request(app).post("/api/company/create-token");
            expect(response.statusCode).toBe(403);
        });

        test("POST /api/company/batch-mint should succeed", async () => {
            const response = await request(app)
                .post("/api/company/batch-mint")
                .set("x-admin-key", adminKey)
                .send({
                    mints: [
                        { wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", amount: 10 },
                    ],
                });
            expect(response.statusCode).toBe(200);
            expect(response.body.results[0].status).toBe("success");
        });
    });

    describe("User Endpoints", () => {
        test("GET /api/user/votes should return votes", async () => {
            const response = await request(app).get("/api/user/votes");
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body.votes)).toBe(true);
        });

        test("POST /api/user/claim-share should succeed when KYC is approved", async () => {
            const response = await request(app)
                .post("/api/user/claim-share")
                .send({
                    sessionId: "550e8400-e29b-41d4-a716-446655440000",
                    walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
                    realName: "John Doe",
                });
            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Token claimed successfully");
        });

        test("POST /api/user/cast-vote should return prepared transaction", async () => {
            const response = await request(app)
                .post("/api/user/cast-vote")
                .send({
                    voteAccount: "8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
                    voteDirection: true,
                    voterWallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
                });
            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Transaction prepared");
            expect(response.body).toHaveProperty("transaction");
        });

        test("POST /api/user/delegate should return prepared transaction", async () => {
            const response = await request(app)
                .post("/api/user/delegate")
                .send({
                    ownerWallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
                    delegateWallet: "6yLYuh3DX98e98UYJTEqcE6kifUqB94UAZSvKptKhBtV"
                });
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("delegationPDA");
        });

        test("POST /api/user/cast-proxy-vote should return prepared transaction", async () => {
            const response = await request(app)
                .post("/api/user/cast-proxy-vote")
                .send({
                    voteAccount: "8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
                    voteDirection: true,
                    delegateWallet: "6yLYuh3DX98e98UYJTEqcE6kifUqB94UAZSvKptKhBtV",
                    ownerWallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
                });
            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Transaction prepared");
        });

        test("GET /api/user/delegation/:walletAddress should return delegation status", async () => {
            const response = await request(app).get("/api/user/delegation/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");
            expect(response.statusCode).toBe(200);
            expect(response.body.isDelegating).toBe(true);
        });
    });

    describe("Advanced Admin & Audit Endpoints", () => {
        const adminKey = process.env.ADMIN_KEY || "test-admin-key";

        test("POST /api/company/close-vote should succeed", async () => {
            const response = await request(app)
                .post("/api/company/close-vote")
                .set("x-admin-key", adminKey)
                .send({ voteAccount: "8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" });
            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Vote closed successfully");
        });

        test("GET /api/company/shareholders should list users", async () => {
            const response = await request(app)
                .get("/api/company/shareholders")
                .set("x-admin-key", adminKey);
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body.shareholders)).toBe(true);
        });

        test("GET /api/company/vote-details/:voteAccount should return real-name audit info", async () => {
            const response = await request(app)
                .get("/api/company/vote-details/8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU")
                .set("x-admin-key", adminKey);
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body.voteDetails)).toBe(true);
        });
    });

    describe("Analytics Endpoints", () => {
        const adminKey = process.env.ADMIN_KEY || "test-admin-key";

        test("GET /api/analytics/overview should return aggregated data", async () => {
            const response = await request(app)
                .get("/api/analytics/overview")
                .set("x-admin-key", adminKey);
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("overview");
            expect(response.body.overview).toHaveProperty("totalProposals");
        });
    });
});
