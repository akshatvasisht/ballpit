const express = require("express");
const router = express.Router();
const { createVerificationSession, checkVerificationStatus } = require("../services/kycService");
const { validate, schemas } = require("./schemas");

/**
 * @route POST /api/kyc/verify
 * @desc Create a mock verification session
 * @body { "walletAddress": "..." }
 */
router.post("/verify", validate(schemas.kycVerify), async (req, res, next) => {
    try {
        const { walletAddress } = req.body;

        const result = await createVerificationSession(walletAddress);
        res.json({
            verificationUrl: result.url,
            sessionId: result.session_id,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/kyc/status/:sessionId
 * @desc Check the verification status of a session. Supports both URL params and query strings.
 * @param {string} sessionId - The session ID to check (URL param)
 * @query {string} sessionId - The session ID to check (Query param)
 * @returns {Promise<{status: string}>}
 */
// Support both /api/kyc/status/:sessionId (legacy/tests) and /api/kyc/status?sessionId=... (frontend)
const handleStatusCheck = async (req, res, next) => {
    try {
        const sessionId = req.params.sessionId || req.query.sessionId;
        if (!sessionId) {
            const error = new Error("Session ID is required");
            error.status = 400;
            throw error;
        }

        const status = await checkVerificationStatus(sessionId);
        res.json({ status });
    } catch (error) {
        next(error);
    }
};

router.get("/status", handleStatusCheck);
router.get("/status/:sessionId", handleStatusCheck);

module.exports = router;
