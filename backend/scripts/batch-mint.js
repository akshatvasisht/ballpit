#!/usr/bin/env node

/**
 * Ballpit Batch Minting CLI
 * Usage: node batch-mint.js <path-to-json>
 * 
 * This script reads a JSON file containing a list of wallets and amounts
 * and calls the Ballpit backend to mint tokens in batch.
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const API_URL = process.env.API_URL || "http://localhost:3001";
const ADMIN_KEY = process.env.ADMIN_KEY;

async function run() {
    const filePath = process.argv[2];

    if (!filePath) {
        console.error("Usage: node batch-mint.js <path-to-json>");
        process.exit(1);
    }

    if (!ADMIN_KEY) {
        console.error("Error: ADMIN_KEY not found in .env");
        process.exit(1);
    }

    const absPath = path.resolve(filePath);
    if (!fs.existsSync(absPath)) {
        console.error(`Error: File not found at ${absPath}`);
        process.exit(1);
    }

    console.log(`Reading mints from: ${absPath}`);
    let data;
    try {
        const fileContent = fs.readFileSync(absPath, "utf-8");
        data = JSON.parse(fileContent);
    } catch (error) {
        console.error(`Error parsing JSON: ${error.message}`);
        process.exit(1);
    }

    if (!data.mints || !Array.isArray(data.mints)) {
        console.error("Error: JSON must contain a 'mints' array.");
        process.exit(1);
    }

    console.log(`Sending batch request for ${data.mints.length} shareholders...`);

    try {
        const response = await axios.post(`${API_URL}/api/company/batch-mint`, data, {
            headers: {
                "x-admin-key": ADMIN_KEY,
                "Content-Type": "application/json"
            }
        });

        console.log("\nBatch Minting Completed!");

        const results = response.data.results.map(r => ({
            Wallet: r.wallet,
            Status: r.status === "success" ? "Success" : "Failed",
            Error: r.error || "N/A"
        }));

        console.table(results);
    } catch (error) {
        if (error.response) {
            console.error(`\nError from server: ${error.response.data.error || error.response.statusText}`);
            if (error.response.data.details) {
                console.error("Details:", JSON.stringify(error.response.data.details, null, 2));
            }
        } else {
            console.error(`\nNetwork Error: ${error.message}`);
        }
    }
}

run();
