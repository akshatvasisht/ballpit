require("dotenv").config();
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const { mapSolanaError } = require("../utils/errorMapper");

/**
 * Middleware to add a unique Request ID to each request
 */
const requestId = (req, res, next) => {
    req.id = crypto.randomUUID();
    res.setHeader("X-Request-ID", req.id);
    next();
};

/**
 * Rate limiting middleware to prevent abuse
 */
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." }
});

/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
    const reqId = req.id || "unknown";

    // Log the error with request ID for traceability
    console.error(`[Error] [RequestID: ${reqId}]`, err);

    // If headers already sent, delegate to default Express handler
    if (res.headersSent) {
        return next(err);
    }

    // Handle Solana Specific Errors via Mapper
    if (err.logs || err.message?.includes("custom program error") || err.message?.includes("AnchorError")) {
        const { status, message } = mapSolanaError(err);
        return res.status(status).json({
            error: message,
            requestId: reqId,
            code: "BLOCKCHAIN_ERROR"
        });
    }

    // Handle Zod Validation Errors (if they reach here)
    if (err.name === "ZodError" || err.issues) {
        return res.status(400).json({
            error: "Validation failed",
            details: err.issues?.map(e => ({ path: e.path, message: e.message })),
            requestId: reqId,
            code: "VALIDATION_ERROR"
        });
    }

    // Default Error Response
    const status = err.status || 500;
    const message = err.message || "An unexpected internal server error occurred.";

    res.status(status).json({
        error: message,
        requestId: reqId,
        code: err.code || "INTERNAL_ERROR"
    });
};

const ADMIN_KEY = process.env.ADMIN_KEY;

function requireAdmin(req, res, next) {
    const adminKey = req.headers["x-admin-key"];

    if (!ADMIN_KEY) {
        console.error("ADMIN_KEY environment variable is not set");
        return res.status(500).json({ error: "Server configuration error: ADMIN_KEY not set" });
    }

    if (!adminKey || adminKey !== ADMIN_KEY) {
        return res.status(403).json({ error: "Forbidden: Admin authentication required" });
    }

    next();
}

module.exports = {
    requestId,
    limiter,
    errorHandler,
    requireAdmin
};
