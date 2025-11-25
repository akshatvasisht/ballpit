/**
 * Real Name Registry Database Module
 * Uses lowdb for local JSON file storage
 */

const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const path = require("path");

// Initialize database file
const adapter = new FileSync(path.join(__dirname, "db.json"));
const db = low(adapter);

// Set default structure if database is empty
db.defaults({ users: [] }).write();

/**
 * Get the database instance
 * @returns {low.LowdbSync} Database instance
 */
function getDb() {
  return db;
}

/**
 * Add a user to the database
 * @param {string} walletAddress - The wallet address
 * @param {string} realName - The real name of the user
 * @param {string} kycSessionId - The KYC session ID
 * @returns {Object} The saved user object
 */
function addUser(walletAddress, realName, kycSessionId) {
  const user = {
    walletAddress,
    realName,
    kycSessionId,
  };
  
  db.get("users").push(user).write();
  return user;
}

/**
 * Get a user by wallet address
 * @param {string} walletAddress - The wallet address to search for
 * @returns {Object|null} The user object or null if not found
 */
function getUserByWallet(walletAddress) {
  return db.get("users").find({ walletAddress }).value() || null;
}

/**
 * Get all users from the database
 * @returns {Array} Array of all user objects
 */
function getAllUsers() {
  return db.get("users").value();
}

module.exports = {
  getDb,
  addUser,
  getUserByWallet,
  getAllUsers,
};

