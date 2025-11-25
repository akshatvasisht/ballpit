/**
 * KYC Verification Service - Didit API Integration
 * Integrates with Didit API for KYC verification
 */

const axios = require("axios");

/**
 * Create a verification session with Didit
 * @param {string} walletAddress - The wallet address to verify
 * @returns {Promise<{url: string, session_id: string}>}
 */
async function createVerificationSession(walletAddress) {
  if (!process.env.DIDIT_API_KEY) {
    throw new Error("DIDIT_API_KEY environment variable is required");
  }
  if (!process.env.DIDIT_WORKFLOW_ID) {
    throw new Error("DIDIT_WORKFLOW_ID environment variable is required");
  }

  const response = await axios.post(
    "https://verification.didit.me/v2/session/",
    {
      workflow_id: process.env.DIDIT_WORKFLOW_ID,
      vendor_data: walletAddress,
      callback: "http://localhost:3000",
    },
    {
      headers: {
        "X-Api-Key": process.env.DIDIT_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    url: response.data.url,
    session_id: response.data.id,
  };
}

/**
 * Check the verification status of a session
 * @param {string} sessionId - The session ID to check
 * @returns {Promise<string>} Status (e.g., "Approved", "Declined", "In_Progress")
 */
async function checkVerificationStatus(sessionId) {
  if (!process.env.DIDIT_API_KEY) {
    throw new Error("DIDIT_API_KEY environment variable is required");
  }

  const response = await axios.get(
    `https://verification.didit.me/v2/session/${sessionId}`,
    {
      headers: {
        "X-Api-Key": process.env.DIDIT_API_KEY,
      },
    }
  );

  return response.data.status;
}

module.exports = {
  createVerificationSession,
  checkVerificationStatus,
};
