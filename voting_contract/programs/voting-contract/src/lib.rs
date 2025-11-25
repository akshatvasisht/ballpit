use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint, Token, TokenAccount},
};

// This is the main "entrypoint" of our program.
declare_id!("5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4");

#[program]
pub mod voting_contract {
    use super::*;

    /// Instruction 1: Creates a new "Ballot Box" (VoteAccount)
    /// Only the 'authority' (our backend) can call this.
    pub fn initialize_vote(
        ctx: Context<InitializeVote>,
        title: String,
        token_mint: Pubkey,
    ) -> Result<()> {
        let vote_account = &mut ctx.accounts.vote_account;
        
        // Set the initial values for our "Ballot Box"
        vote_account.authority = *ctx.accounts.authority.key;
        vote_account.is_active = true;
        vote_account.title = title;
        vote_account.token_mint = token_mint; // Store the mint this vote is tied to
        vote_account.votes_for = 0;
        vote_account.votes_against = 0;

        Ok(())
    }

    /// Instruction 2: Casts a vote (for or against)
    /// This is the main function for shareholders.
    pub fn cast_vote(ctx: Context<CastVote>, vote_direction: bool) -> Result<()> {
        let vote_account = &mut ctx.accounts.vote_account;
        
        // Security Check 1: Is this "Ballot Box" open for voting?
        require!(vote_account.is_active, VoteError::VoteIsClosed);
        
        // Security Check 2: Does the token they are spending match the
        // token this vote requires?
        require!(
            vote_account.token_mint == ctx.accounts.token_mint.key(),
            VoteError::InvalidTokenMint
        );

        // Security Check 3: Does the voter have at least 1 token?
        require!(
            ctx.accounts.voter_token_account.amount >= 1,
            VoteError::NotEnoughTokens
        );

        // --- Record the Vote ---
        if vote_direction == true {
            vote_account.votes_for = vote_account.votes_for.checked_add(1).unwrap();
        } else {
            vote_account.votes_against = vote_account.votes_against.checked_add(1).unwrap();
        }

        // --- Create the VoteReceipt ---
        // This "receipt" account proves this voter has voted on this proposal,
        // preventing them from voting twice.
        let receipt = &mut ctx.accounts.vote_receipt;
        receipt.voter = *ctx.accounts.voter.key;
        receipt.vote_account = vote_account.key();
        receipt.voted_for = vote_direction;

        Ok(())
    }

    /// Instruction 3: (Optional) Close the vote
    /// So no more votes can be cast.
    pub fn close_vote(ctx: Context<CloseVote>) -> Result<()> {
        ctx.accounts.vote_account.is_active = false;
        Ok(())
    }
}

// --- Data Structures (Accounts) ---

/// Account 1: The "Ballot Box" (VoteAccount)
/// Stores all the info about a single proposal.
#[account]
pub struct VoteAccount {
    pub authority: Pubkey,     // Who created this? (Our backend)
    pub is_active: bool,       // Is voting open?
    pub title: String,         // What's the proposal?
    pub token_mint: Pubkey,    // Which "share token" is used for this vote?
    pub votes_for: u64,        // Count of "YES" votes
    pub votes_against: u64,    // Count of "NO" votes
}

/// Account 2: The "I Voted" Stub (VoteReceipt)
/// This is a PDA (Program Derived Address) linked to the voter
/// and the vote, which stops them from voting twice.
#[account]
pub struct VoteReceipt {
    pub voter: Pubkey,         // The person who voted
    pub vote_account: Pubkey,  // The vote they voted on
    pub voted_for: bool,       // What was their vote?
}

// --- Account Contexts (What each instruction needs) ---

/// Context for `initialize_vote`
#[derive(Accounts)]
pub struct InitializeVote<'info> {
    // This creates a new 'VoteAccount' account.
    #[account(
        init, // 1. 'init' = create this account
        payer = authority, // 2. 'authority' (our backend) pays for it
        space = 8 + 32 + 1 + (4 + 256) + 32 + 8 + 8 // 3. Reserve space (see below)
    )]
    pub vote_account: Account<'info, VoteAccount>,

    // The 'authority' (our backend) must sign to prove it's them.
    #[account(mut)]
    pub authority: Signer<'info>,

    // We need a reference to the System Program to create accounts.
    pub system_program: Program<'info, System>,
}
// Space calculation: 8 (discriminator) + 32 (authority Pubkey) + 1 (is_active bool)
// + (4 + 256) (max title string) + 32 (token_mint Pubkey) + 8 (votes_for u64) + 8 (votes_against u64)

/// Context for `cast_vote`
#[derive(Accounts)]
pub struct CastVote<'info> {
    // 1. The "Ballot Box" we are voting on
    #[account(mut)] // 'mut' because we are changing its vote counts
    pub vote_account: Account<'info, VoteAccount>,

    // 2. The "I Voted" receipt.
    // We create it here to prevent double-voting.
    #[account(
        init, // 'init' = create this account
        payer = voter, // The 'voter' pays for their own receipt
        space = 8 + 32 + 32 + 1, // Space for the struct
        seeds = [b"receipt", vote_account.key().as_ref(), voter.key().as_ref()], // Unique PDA seed
        bump
    )]
    pub vote_receipt: Account<'info, VoteReceipt>,

    // 3. The Voter
    #[account(mut)]
    pub voter: Signer<'info>, // They must sign to prove it's them

    // 4. The Voter's Token Account
    // This is the wallet that *holds* their 1 "share token".
    #[account(mut)]
    pub voter_token_account: Account<'info, TokenAccount>,

    // 5. The Mint of the "Share Token"
    // We need this to verify the token being burned.
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,

    // 6. Required Solana Programs
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Context for `close_vote`
#[derive(Accounts)]
pub struct CloseVote<'info> {
    // Only the original 'authority' can close the vote
    #[account(
        mut,
        has_one = authority // This constraint checks if 'authority' is the one in VoteAccount
    )]
    pub vote_account: Account<'info, VoteAccount>,
    
    // The authority must sign.
    pub authority: Signer<'info>,
}

// --- Custom Errors ---
#[error_code]
pub enum VoteError {
    #[msg("Voting is already closed for this proposal.")]
    VoteIsClosed,
    #[msg("The token mint provided does not match the one required for this vote.")]
    InvalidTokenMint,
    #[msg("You do not have enough tokens to vote.")]
    NotEnoughTokens,
}