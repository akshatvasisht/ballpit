# BadgerBuild API Documentation

This document describes the REST API endpoints and smart contract interface for the BadgerBuild backend.

## REST API

Base URL: `http://localhost:3001` (or configured `PORT`)

All endpoints return JSON responses. Error responses include an `error` field with a description.

---

## KYC Endpoints

### Create Verification Session

**Endpoint:** `POST /api/kyc/verify`

Creates a KYC verification session with Didit for a wallet address.

**Request Body:**
```json
{
  "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
}
```

**Response (Success):**
```json
{
  "verificationUrl": "https://verification.didit.me/...",
  "sessionId": "session_123456789"
}
```

**Status Codes:**
- `200`: Session created successfully
- `400`: Missing `walletAddress` in request body
- `500`: Failed to create verification session (check Didit API credentials)

---

### Check Verification Status

**Endpoint:** `GET /api/kyc/status/:sessionId`

Checks the verification status of a KYC session.

**Path Parameters:**
- `sessionId` (string): The KYC session ID to check

**Response (Success):**
```json
{
  "status": "Approved"
}
```

**Status Values:**
- `"Approved"`: KYC verification completed and approved
- `"Declined"`: KYC verification was declined
- `"In_Progress"`: KYC verification is still in progress
- `"Pending"`: KYC verification is pending

**Status Codes:**
- `200`: Status retrieved successfully
- `400`: Missing `sessionId` parameter
- `500`: Failed to check verification status

---

## Company Endpoints

All company endpoints require admin authentication via `x-admin-key` header.

### Create Share Token

**Endpoint:** `POST /api/company/create-token`

Creates a new SPL token mint for company shares. This token will be used for all voting operations.

**Headers:**
- `x-admin-key` (string, required): Admin authentication key

**Response (Success):**
```json
{
  "message": "Token created successfully",
  "tokenMint": "4tbkoExLHa9j62vCshizth9HdQjvyDpSeMnto2DmnMh7"
}
```

**Status Codes:**
- `200`: Token created successfully
- `403`: Admin authentication failed
- `500`: Failed to create token (check Solana connection and wallet balance)

**Note:** Copy the `tokenMint` value and set it as `SHARE_TOKEN_MINT` in your `.env` file.

---

### Mint Share Token

**Endpoint:** `POST /api/company/mint-share`

Mints share tokens to a verified shareholder's wallet.

**Headers:**
- `x-admin-key` (string, required): Admin authentication key

**Request Body:**
```json
{
  "shareholderWallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "amount": 1
}
```

**Response (Success):**
```json
{
  "message": "Share token minted successfully",
  "tokenAccount": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "amount": 1
}
```

**Status Codes:**
- `200`: Token minted successfully
- `400`: Missing `shareholderWallet` in request body
- `403`: Admin authentication failed
- `500`: Failed to mint token

---

### Create Vote Proposal

**Endpoint:** `POST /api/company/create-vote`

Creates a new vote proposal (VoteAccount) on-chain.

**Headers:**
- `x-admin-key` (string, required): Admin authentication key

**Request Body:**
```json
{
  "title": "Approve merger with Company XYZ"
}
```

**Response (Success):**
```json
{
  "message": "Vote created successfully",
  "voteAccount": "8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "transaction": "5j7s8K9m2nP3qR4tS5uV6wX7yZ8aB9cD0eF1gH2iJ3kL4mN5oP6qR7sT8uV9wX"
}
```

**Status Codes:**
- `200`: Vote created successfully
- `400`: Missing `title` in request body
- `403`: Admin authentication failed
- `500`: Failed to initialize vote (check Solana connection and program deployment)

---

### Get All Votes

**Endpoint:** `GET /api/company/votes`

Retrieves all votes created by the company with participation analytics.

**Note:** This endpoint does not require admin authentication. It is publicly accessible but only returns votes created by the backend authority wallet.

**Response (Success):**
```json
{
  "votes": [
    {
      "voteAccount": "8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "title": "Approve merger with Company XYZ",
      "votesFor": "15",
      "votesAgainst": "3",
      "totalVotes": 18,
      "participationRate": "18.00%",
      "totalSupply": 100,
      "isActive": true,
      "authority": "5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4",
      "tokenMint": "4tbkoExLHa9j62vCshizth9HdQjvyDpSeMnto2DmnMh7"
    }
  ]
}
```

**Status Codes:**
- `200`: Votes retrieved successfully
- `500`: Failed to fetch votes

---

### Get Vote Details

**Endpoint:** `GET /api/company/vote/:voteAccount`

Retrieves detailed information about a specific vote.

**Path Parameters:**
- `voteAccount` (string): The vote account public key

**Response (Success):**
```json
{
  "voteAccount": "8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "title": "Approve merger with Company XYZ",
  "isActive": true,
  "votesFor": "15",
  "votesAgainst": "3",
  "tokenMint": "4tbkoExLHa9j62vCshizth9HdQjvyDpSeMnto2DmnMh7",
  "authority": "5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4"
}
```

**Status Codes:**
- `200`: Vote retrieved successfully
- `500`: Failed to fetch vote

---

### Get Vote Details with Real Names

**Endpoint:** `GET /api/company/vote-details/:voteAccount`

Retrieves vote details including real names from the Real Name Registry (admin only).

**Headers:**
- `x-admin-key` (string, required): Admin authentication key

**Path Parameters:**
- `voteAccount` (string): The vote account public key

**Response (Success):**
```json
{
  "voteDetails": [
    {
      "voterName": "John Doe",
      "wallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "voteDirection": "For"
    },
    {
      "voterName": "Jane Smith",
      "wallet": "6yLYuh3DX98e98UYJTEqcE6kifUqB94UAZSvKptKhBtV",
      "voteDirection": "Against"
    }
  ]
}
```

**Status Codes:**
- `200`: Vote details retrieved successfully
- `403`: Admin authentication failed
- `500`: Failed to fetch vote details

---

### Close Vote

**Endpoint:** `POST /api/company/close-vote`

Closes a vote, preventing new votes from being cast.

**Headers:**
- `x-admin-key` (string, required): Admin authentication key

**Request Body:**
```json
{
  "voteAccount": "8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
}
```

**Response (Success):**
```json
{
  "message": "Vote closed successfully",
  "transaction": "5j7s8K9m2nP3qR4tS5uV6wX7yZ8aB9cD0eF1gH2iJ3kL4mN5oP6qR7sT8uV9wX"
}
```

**Status Codes:**
- `200`: Vote closed successfully
- `400`: Missing `voteAccount` in request body
- `403`: Admin authentication failed
- `500`: Failed to close vote

---

### Get All Shareholders

**Endpoint:** `GET /api/company/shareholders`

Retrieves all shareholders from the Real Name Registry (admin only).

**Headers:**
- `x-admin-key` (string, required): Admin authentication key

**Response (Success):**
```json
{
  "shareholders": [
    {
      "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "realName": "John Doe",
      "kycSessionId": "session_123456789"
    }
  ]
}
```

**Status Codes:**
- `200`: Shareholders retrieved successfully
- `403`: Admin authentication failed
- `500`: Failed to fetch shareholders

---

## User Endpoints

### Get Available Votes

**Endpoint:** `GET /api/user/votes`

Retrieves all available votes for users to view and vote on.

**Response (Success):**
```json
{
  "votes": [
    {
      "voteAccount": "8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "title": "Approve merger with Company XYZ",
      "votesFor": "15",
      "votesAgainst": "3",
      "isActive": true,
      "authority": "5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4",
      "tokenMint": "4tbkoExLHa9j62vCshizth9HdQjvyDpSeMnto2DmnMh7"
    }
  ]
}
```

**Status Codes:**
- `200`: Votes retrieved successfully
- `500`: Failed to fetch votes

---

### Get Vote Details

**Endpoint:** `GET /api/user/vote/:voteAccount`

Retrieves detailed information about a specific vote for users.

**Path Parameters:**
- `voteAccount` (string): The vote account public key

**Response (Success):**
```json
{
  "voteAccount": "8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "title": "Approve merger with Company XYZ",
  "isActive": true,
  "votesFor": "15",
  "votesAgainst": "3",
  "tokenMint": "4tbkoExLHa9j62vCshizth9HdQjvyDpSeMnto2DmnMh7"
}
```

**Status Codes:**
- `200`: Vote retrieved successfully
- `500`: Failed to fetch vote

---

### Claim Share Token

**Endpoint:** `POST /api/user/claim-share`

Allows a verified user to claim their share token after KYC approval.

**Request Body:**
```json
{
  "sessionId": "session_123456789",
  "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "realName": "John Doe"
}
```

**Response (Success):**
```json
{
  "message": "Share token claimed successfully",
  "tokenAccount": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "amount": 1,
  "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "realName": "John Doe",
  "kycSessionId": "session_123456789"
}
```

**Status Codes:**
- `200`: Share token claimed successfully
- `400`: Missing required fields or tokens already minted
- `403`: KYC verification not approved (unless `DEV_MODE=true`)
- `500`: Failed to claim share token

**Note:** If `DEV_MODE=true` in environment variables, KYC verification is bypassed for development.

---

### Cast Vote

**Endpoint:** `POST /api/user/cast-vote`

Prepares a vote transaction. The user must sign and submit the transaction from the frontend.

**Request Body:**
```json
{
  "voteAccount": "8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "voteDirection": true,
  "voterWallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
}
```

**Response (Success):**
```json
{
  "message": "Transaction prepared. User must sign from frontend.",
  "transaction": { /* Solana Transaction object */ },
  "voteReceipt": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
}
```

**Status Codes:**
- `200`: Transaction prepared successfully
- `400`: Missing required fields or insufficient tokens
- `500`: Failed to prepare transaction

**Note:** The frontend must sign and send the transaction using the Solana wallet.

---

### Set Delegate

**Endpoint:** `POST /api/user/delegate`

Prepares a delegation transaction. The owner must sign and submit from the frontend.

**Request Body:**
```json
{
  "ownerWallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "delegateWallet": "6yLYuh3DX98e98UYJTEqcE6kifUqB94UAZSvKptKhBtV"
}
```

**Response (Success):**
```json
{
  "message": "Transaction prepared. User must sign from frontend.",
  "transaction": { /* Solana Transaction object */ },
  "delegationPDA": "8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
}
```

**Status Codes:**
- `200`: Transaction prepared successfully
- `400`: Missing required fields
- `500`: Failed to prepare transaction

---

### Cast Proxy Vote

**Endpoint:** `POST /api/user/cast-proxy-vote`

Prepares a proxy vote transaction. The delegate must sign and submit from the frontend.

**Request Body:**
```json
{
  "voteAccount": "8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "voteDirection": true,
  "delegateWallet": "6yLYuh3DX98e98UYJTEqcE6kifUqB94UAZSvKptKhBtV",
  "ownerWallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
}
```

**Response (Success):**
```json
{
  "message": "Transaction prepared. Delegate must sign from frontend.",
  "transaction": { /* Solana Transaction object */ },
  "voteReceipt": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
}
```

**Status Codes:**
- `200`: Transaction prepared successfully
- `400`: Missing required fields or invalid delegation
- `500`: Failed to prepare transaction

---

### Get Delegation Status

**Endpoint:** `GET /api/user/delegation/:walletAddress`

Retrieves delegation status for a wallet address.

**Path Parameters:**
- `walletAddress` (string): The wallet address to check

**Response (Success - Delegating):**
```json
{
  "isDelegating": true,
  "delegate": "6yLYuh3DX98e98UYJTEqcE6kifUqB94UAZSvKptKhBtV",
  "owner": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "mint": "4tbkoExLHa9j62vCshizth9HdQjvyDpSeMnto2DmnMh7"
}
```

**Response (Success - Not Delegating):**
```json
{
  "isDelegating": false
}
```

**Status Codes:**
- `200`: Delegation status retrieved successfully
- `400`: Missing `walletAddress` parameter
- `500`: Failed to get delegation status

---

### Revoke Delegation

**Endpoint:** `POST /api/user/revoke-delegate`

Prepares a revocation transaction. The owner must sign and submit from the frontend.

**Request Body:**
```json
{
  "ownerWallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
}
```

**Response (Success):**
```json
{
  "message": "Transaction prepared. User must sign from frontend.",
  "transaction": { /* Solana Transaction object */ },
  "delegationPDA": "8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
}
```

**Status Codes:**
- `200`: Transaction prepared successfully
- `400`: Missing `ownerWallet` in request body
- `500`: Failed to prepare transaction

---

## Legacy Endpoints

The following legacy endpoints are maintained for backward compatibility. They redirect to the new API endpoints:

### Create Token (Legacy)

**Endpoint:** `POST /create-token`

Redirects to `POST /api/company/create-token`.

**Note:** This endpoint does not require admin authentication (unlike the new endpoint). Consider migrating to the new endpoint.

---

### Mint Share (Legacy)

**Endpoint:** `POST /mint-share`

Redirects to `POST /api/company/mint-share`.

**Note:** This endpoint does not require admin authentication (unlike the new endpoint). Consider migrating to the new endpoint.

---

### Initialize Vote (Legacy)

**Endpoint:** `POST /initialize-vote`

Redirects to `POST /api/company/create-vote`.

**Note:** This endpoint does not require admin authentication (unlike the new endpoint). Consider migrating to the new endpoint.

---

## Smart Contract Interface

### Program ID

`5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4`

### Instructions

#### initialize_vote

Creates a new VoteAccount (vote proposal).

**Accounts:**
- `vote_account` (writable, signer): New VoteAccount to create
- `authority` (writable, signer): Authority wallet (backend)
- `system_program`: System Program

**Arguments:**
- `title` (string): Proposal title
- `token_mint` (Pubkey): Share token mint address

**Errors:**
- None (account creation errors handled by Anchor)

---

#### cast_vote

Casts a vote on a proposal.

**Accounts:**
- `vote_account` (writable): VoteAccount being voted on
- `vote_receipt` (writable): VoteReceipt PDA (created)
- `voter` (writable, signer): Voter's wallet
- `voter_token_account` (writable): Voter's token account
- `token_mint` (writable): Share token mint
- `token_program`: Token Program
- `system_program`: System Program

**Arguments:**
- `vote_direction` (bool): `true` for "for", `false` for "against"

**Errors:**
- `VoteIsClosed`: Vote is no longer active
- `InvalidTokenMint`: Token mint doesn't match vote's token mint
- `NotEnoughTokens`: Voter doesn't have enough tokens

---

#### cast_proxy_vote

Casts a proxy vote on behalf of an owner.

**Accounts:**
- `vote_account` (writable): VoteAccount being voted on
- `delegation_record`: Delegation PDA
- `owner_token_account` (writable): Owner's token account
- `delegate` (writable, signer): Delegate's wallet
- `vote_receipt` (writable): VoteReceipt PDA (created, uses owner's key)
- `token_mint`: Share token mint
- `token_program`: Token Program
- `system_program`: System Program

**Arguments:**
- `vote_direction` (bool): `true` for "for", `false` for "against"

**Errors:**
- `VoteIsClosed`: Vote is no longer active
- `InvalidDelegate`: Delegate doesn't match delegation record
- `DelegateNotAuthorized`: Delegate not authorized for this owner
- `InvalidTokenMint`: Token mint doesn't match
- `NotEnoughTokens`: Owner doesn't have enough tokens

---

#### set_delegate

Sets or updates a delegation.

**Accounts:**
- `delegation` (writable): Delegation PDA (created/updated)
- `authority` (writable, signer): Owner's wallet
- `mint`: Share token mint
- `system_program`: System Program

**Arguments:**
- `delegate_address` (Pubkey): Delegate's wallet address

**Errors:**
- None (account creation errors handled by Anchor)

---

#### revoke_delegation

Revokes a delegation and closes the account.

**Accounts:**
- `delegation` (writable): Delegation PDA to close
- `authority` (writable, signer): Owner's wallet
- `mint`: Share token mint

**Arguments:**
- None

**Errors:**
- None (account closure handled by Anchor)

---

#### close_vote

Closes a vote, preventing new votes.

**Accounts:**
- `vote_account` (writable): VoteAccount to close
- `authority` (signer): Authority wallet (must match vote_account.authority)

**Arguments:**
- None

**Errors:**
- `VoteIsClosed`: Vote is already closed (if somehow called twice)

---

### Account Structures

#### VoteAccount

```rust
pub struct VoteAccount {
    pub authority: Pubkey,      // Vote creator
    pub is_active: bool,         // Voting status
    pub title: String,           // Proposal title
    pub token_mint: Pubkey,      // Share token mint
    pub votes_for: u64,          // "For" vote count
    pub votes_against: u64,      // "Against" vote count
}
```

#### VoteReceipt

```rust
pub struct VoteReceipt {
    pub voter: Pubkey,           // Voter's wallet (owner in proxy votes)
    pub vote_account: Pubkey,    // VoteAccount address
    pub voted_for: bool,         // Vote direction
}
```

#### Delegation

```rust
pub struct Delegation {
    pub owner: Pubkey,           // Token owner
    pub delegate: Pubkey,        // Delegate wallet
    pub mint: Pubkey,            // Token mint
}
```

---

## Error Handling

All API endpoints return standard HTTP status codes:

- `200`: Success
- `400`: Bad Request (missing/invalid parameters)
- `403`: Forbidden (authentication failed)
- `500`: Internal Server Error (server/blockchain error)

Error responses include an `error` field:

```json
{
  "error": "Failed to create vote",
  "details": "Insufficient funds for transaction"
}
```

Smart contract errors are returned as Anchor error codes and can be caught in transaction receipts. Error codes are auto-generated by Anchor and may vary. Use error names (`VoteIsClosed`, `InvalidTokenMint`, `NotEnoughTokens`, `InvalidDelegate`, `DelegateNotAuthorized`) rather than specific codes for error handling.

