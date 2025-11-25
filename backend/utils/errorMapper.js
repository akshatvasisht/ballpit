/**
 * Maps Solana program errors and transaction failures to descriptive messages.
 */
const mapSolanaError = (error) => {
    const errorMessage = error.message || "";
    const logs = error.logs || [];

    // Check for custom program errors from IDL
    if (errorMessage.includes("custom program error: 0x1770") || logs.some(l => l.includes("VoteIsClosed"))) {
        return { status: 400, message: "Voting is already closed for this proposal." };
    }
    if (errorMessage.includes("custom program error: 0x1771") || logs.some(l => l.includes("InvalidTokenMint"))) {
        return { status: 400, message: "The token mint provided does not match the one required for this vote." };
    }

    // Check for common Anchor/System errors
    if (errorMessage.includes("already in use") || logs.some(l => l.includes("already in use"))) {
        return { status: 400, message: "Action already taken (e.g., already voted or delegation exists)." };
    }

    if (errorMessage.includes("InsufficientFunds") || logs.some(l => l.includes("InsufficientFunds"))) {
        return { status: 402, message: "Wallet lacks required funds or voting tokens." };
    }

    if (errorMessage.includes("AccountNotInitialized") || logs.some(l => l.includes("AccountNotInitialized"))) {
        return { status: 404, message: "A required account was not initialized." };
    }

    // Default error
    return { status: 500, message: errorMessage || "An unexpected blockchain error occurred." };
};

module.exports = { mapSolanaError };
