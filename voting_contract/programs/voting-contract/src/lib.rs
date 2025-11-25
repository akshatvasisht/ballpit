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
        
        // Security Check 2: Does the voter have at least 1 token?
        // Note: Token mint matching is now enforced via Anchor constraints in CastVote struct
        require!(
            ctx.accounts.voter_token_account.amount >= 1,
            VoteError::NotEnoughTokens
        );

        // --- Record the Vote (weighted by actual token balance) ---
        let vote_weight = ctx.accounts.voter_token_account.amount;
        if vote_direction {
            vote_account.votes_for = vote_account.votes_for
                .checked_add(vote_weight)
                .ok_or(VoteError::Overflow)?;
        } else {
            vote_account.votes_against = vote_account.votes_against
                .checked_add(vote_weight)
                .ok_or(VoteError::Overflow)?;
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

    /// Instruction 4: Set or update a delegate
    /// Allows a token owner to delegate their voting rights to another address.
    pub fn set_delegate(ctx: Context<SetDelegate>, delegate_address: Pubkey) -> Result<()> {
        let delegation = &mut ctx.accounts.delegation;
        delegation.owner = *ctx.accounts.authority.key;
        delegation.delegate = delegate_address;
        delegation.mint = ctx.accounts.mint.key();
        Ok(())
    }

    /// Instruction 5: Cast a proxy vote
    /// Allows a delegate to vote on behalf of an owner.
    pub fn cast_proxy_vote(ctx: Context<CastProxyVote>, vote_direction: bool) -> Result<()> {
        let vote_account = &mut ctx.accounts.vote_account;
        let delegation_record = &ctx.accounts.delegation_record;
        let owner_token_account = &ctx.accounts.owner_token_account;
        let delegate = &ctx.accounts.delegate;

        // Security Check 1: Is this "Ballot Box" open for voting?
        require!(vote_account.is_active, VoteError::VoteIsClosed);

        // Security Check 2: Does the delegate match the delegation record?
        require!(
            delegation_record.delegate == delegate.key(),
            VoteError::InvalidDelegate
        );

        // Security Check 3: Does the owner match the delegation record?
        require!(
            delegation_record.owner == owner_token_account.owner,
            VoteError::DelegateNotAuthorized
        );

        // Security Check 4: Does the mint match the delegation record?
        require!(
            delegation_record.mint == vote_account.token_mint,
            VoteError::InvalidTokenMint
        );

        // Security Check 5: Does the owner have at least 1 token?
        require!(
            owner_token_account.amount >= 1,
            VoteError::NotEnoughTokens
        );

        // --- Record the Vote (weighted by owner's actual token balance) ---
        let vote_weight = owner_token_account.amount;
        if vote_direction {
            vote_account.votes_for = vote_account.votes_for
                .checked_add(vote_weight)
                .ok_or(VoteError::Overflow)?;
        } else {
            vote_account.votes_against = vote_account.votes_against
                .checked_add(vote_weight)
                .ok_or(VoteError::Overflow)?;
        }

        // --- Create the VoteReceipt ---
        // This "receipt" account proves the owner has voted on this proposal,
        // preventing them from voting twice. The voter field is set to the owner,
        // not the delegate, for correct attribution.
        let receipt = &mut ctx.accounts.vote_receipt;
        receipt.voter = owner_token_account.owner;
        receipt.vote_account = vote_account.key();
        receipt.voted_for = vote_direction;

        Ok(())
    }

    /// Instruction 6: Revoke delegation
    /// Allows the owner to revoke their delegation and close the account, refunding rent.
    pub fn revoke_delegation(_ctx: Context<RevokeDelegation>) -> Result<()> {
        // The account will be closed automatically by Anchor's close constraint
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

/// Account 3: Delegation Record
/// Stores delegation information allowing an owner to delegate voting rights to a delegate.
/// This is a PDA seeded by [b"delegation", owner_key, mint_key]
#[account]
pub struct Delegation {
    pub owner: Pubkey,    // The token owner who is delegating
    pub delegate: Pubkey, // The delegate who can vote on behalf of the owner
    pub mint: Pubkey,     // The token mint this delegation is for
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
    #[account(
        mut,
        // CORRECTION 1: Ensure the voter actually owns this account
        constraint = voter_token_account.owner == voter.key(),
        // CORRECTION 2: Ensure this account holds the CORRECT token (not a random one)
        constraint = voter_token_account.mint == vote_account.token_mint @ VoteError::InvalidTokenMint
    )]
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

/// Context for `set_delegate`
#[derive(Accounts)]
pub struct SetDelegate<'info> {
    // The delegation account (PDA)
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + 32 + 32 + 32, // 8 (discriminator) + 32 (owner) + 32 (delegate) + 32 (mint)
        seeds = [b"delegation", authority.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub delegation: Account<'info, Delegation>,

    // The owner (authority) who is delegating
    #[account(mut)]
    pub authority: Signer<'info>,

    // The token mint this delegation is for
    pub mint: Account<'info, Mint>,

    // Required Solana Programs
    pub system_program: Program<'info, System>,
}

/// Context for `cast_proxy_vote`
#[derive(Accounts)]
pub struct CastProxyVote<'info> {
    // 1. The "Ballot Box" we are voting on
    #[account(mut)]
    pub vote_account: Account<'info, VoteAccount>,

    // 2. The delegation record (PDA)
    #[account(
        seeds = [b"delegation", owner_token_account.owner.as_ref(), vote_account.token_mint.as_ref()],
        bump
    )]
    pub delegation_record: Account<'info, Delegation>,

    // 3. The Owner's Token Account
    // Constraint ensures the token account's mint matches the vote's token mint
    #[account(
        mut,
        constraint = owner_token_account.mint == vote_account.token_mint @ VoteError::InvalidTokenMint
    )]
    pub owner_token_account: Account<'info, TokenAccount>,

    // 4. The Delegate (signer)
    #[account(mut)]
    pub delegate: Signer<'info>,

    // 5. The "I Voted" receipt.
    // We create it here to prevent double-voting.
    // Uses OWNER key, not delegate key, so owner cannot vote later if delegate already did.
    #[account(
        init,
        payer = delegate,
        space = 8 + 32 + 32 + 1, // Space for the struct
        seeds = [b"receipt", vote_account.key().as_ref(), owner_token_account.owner.as_ref()],
        bump
    )]
    pub vote_receipt: Account<'info, VoteReceipt>,

    // 6. The Mint of the "Share Token"
    pub token_mint: Account<'info, Mint>,

    // 7. Required Solana Programs
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Context for `revoke_delegation`
#[derive(Accounts)]
pub struct RevokeDelegation<'info> {
    // The delegation account to close (PDA)
    #[account(
        mut,
        close = authority, // Close the account and send rent to authority
        seeds = [b"delegation", authority.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub delegation: Account<'info, Delegation>,

    // The owner (authority) who is revoking the delegation
    #[account(mut)]
    pub authority: Signer<'info>,

    // The token mint (needed for PDA derivation)
    pub mint: Account<'info, Mint>,
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
    #[msg("The provided delegate does not match the delegation record.")]
    InvalidDelegate,
    #[msg("The delegate is not authorized to vote for this owner.")]
    DelegateNotAuthorized,
    #[msg("Vote count overflow.")]
    Overflow,
}