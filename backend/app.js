const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { requestId, limiter, errorHandler } = require("./routes/middleware");
const userRoutes = require("./routes/userRoutes");
const companyRoutes = require("./routes/companyRoutes");

const app = express();

/**
 * Global Middleware
 */
app.use(requestId);
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(limiter);

/**
 * API Routes
 */
app.use("/api/user", userRoutes);
app.use("/api/company", companyRoutes);

/**
 * Health Check
 */
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * Global Error Handler (must be last)
 */
app.use(errorHandler);

module.exports = app;
