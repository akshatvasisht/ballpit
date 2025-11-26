/**
 * Mock KYC Verification Service
 * Simulates real-world KYC verification steps: Session creation -> Analysis -> Approval
 */

const crypto = require("crypto");

// Store sessions in memory for the mock service
const mockSessions = new Map();

/**
 * Create a mock verification session
 * @param {string} walletAddress - The wallet address to verify
 * @returns {Promise<{url: string, session_id: string}>}
 */
async function createVerificationSession(walletAddress) {
    const sessionId = `mock_session_${crypto.randomBytes(8).toString("hex")}`;

    // Initial state: In_Progress (simulating user beginning the flow)
    mockSessions.set(sessionId, {
        walletAddress,
        status: "In_Progress",
        createdAt: Date.now(),
    });

    console.log(`[Mock KYC] Created session ${sessionId} for ${walletAddress}`);

    // After 5 seconds, "auto-approve" the session to simulate analysis time
    // In a real hackathon demo, this allows the user to click 'verify' and then 'claim' shortly after
    setTimeout(() => {
        const session = mockSessions.get(sessionId);
        if (session) {
            session.status = "Approved";
            console.log(`[Mock KYC] Session ${sessionId} automatically Approved`);
        }
    }, 5000);

    return {
        url: `http://localhost:3000/verify?sessionId=${sessionId}`,
        session_id: sessionId,
    };
}

/**
 * Check the verification status of a mock session
 * @param {string} sessionId - The session ID to check
 * @returns {Promise<string>} Status ("Approved", "Declined", "In_Progress", "Pending")
 */
async function checkVerificationStatus(sessionId) {
    const session = mockSessions.get(sessionId);
    if (!session) {
        throw new Error("Session not found");
    }

    return session.status;
}

module.exports = {
    createVerificationSession,
    checkVerificationStatus,
};
