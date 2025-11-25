require("dotenv").config();
const app = require("./app");
const solanaService = require("./services/solanaService");

const PORT = process.env.PORT || 3001;

/**
 * Validates that all required environment variables are present and valid
 */
function validateEnv() {
  const required = ["ADMIN_KEY", "PRIVATE_KEY", "PROGRAM_ID"];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(`CRITICAL: Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  // Validate PRIVATE_KEY format (should be a JSON array of numbers)
  try {
    const key = JSON.parse(process.env.PRIVATE_KEY);
    if (!Array.isArray(key)) throw new Error("Not an array");
  } catch (e) {
    console.error("CRITICAL: PRIVATE_KEY must be a valid JSON array of numbers.");
    process.exit(1);
  }

  console.log("Environment validation passed.");
}

async function startServer() {
  validateEnv();

  try {
    // Initialize Solana Service (IDL loading, etc.)
    await solanaService.init();

    const server = app.listen(PORT, () => {
      console.log(`Backend server running at http://localhost:${PORT}`);
      console.log(`   Cluster: ${solanaService.cluster}`);
      console.log(`   Program ID: ${solanaService.programId.toBase58()}`);
    });

    // Graceful Shutdown
    const shutdown = () => {
      console.log("\nReceived shutdown signal. Closing server...");
      server.close(() => {
        console.log("Server closed. Process exiting.");
        process.exit(0);
      });

      // Force exit after 10s if server still hanging
      setTimeout(() => {
        console.error("Could not close connections in time, forcefully shutting down.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
