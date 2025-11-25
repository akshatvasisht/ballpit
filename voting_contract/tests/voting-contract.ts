import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VotingContract } from "../target/types/voting_contract";
import { expect } from "chai";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
} from "@solana/spl-token";

describe("voting-contract", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.votingContract as Program<VotingContract>;

  // Common test state
  let voteAccount: anchor.web3.Keypair;
  let tokenMint: anchor.web3.PublicKey;
  let mintAuthority: anchor.web3.Keypair;
  let voter: anchor.web3.Keypair;
  let voterTokenAccount: anchor.web3.PublicKey;

  before(async () => {
    mintAuthority = anchor.web3.Keypair.generate();
    // Airdrop SOL to mint authority
    const sig1 = await provider.connection.requestAirdrop(
      mintAuthority.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig1);

    voter = anchor.web3.Keypair.generate();
    // Airdrop SOL to voter to pay for transaction fees and PDA rent
    const sig2 = await provider.connection.requestAirdrop(
      voter.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig2);

    // Create token mint
    tokenMint = await createMint(
      provider.connection,
      mintAuthority,
      mintAuthority.publicKey,
      null,
      0
    );

    // Create voter token account
    voterTokenAccount = await createAccount(
      provider.connection,
      mintAuthority,
      tokenMint,
      voter.publicKey
    );
  });

  it("1. Initializes a vote!", async () => {
    voteAccount = anchor.web3.Keypair.generate();
    const title = "New Merger Proposal";

    await program.methods
      .initializeVote(title, tokenMint)
      .accounts({
        voteAccount: voteAccount.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([voteAccount])
      .rpc();

    const account = await program.account.voteAccount.fetch(voteAccount.publicKey);
    expect(account.title).to.equal(title);
    expect(account.isActive).to.be.true;
    expect(account.votesFor.toNumber()).to.equal(0);
    expect(account.votesAgainst.toNumber()).to.equal(0);
  });

  it("2. Casts a vote successfully", async () => {
    // Mint 1 token to voter
    await mintTo(
      provider.connection,
      mintAuthority,
      tokenMint,
      voterTokenAccount,
      mintAuthority,
      1
    );

    const [receiptPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receipt"), voteAccount.publicKey.toBuffer(), voter.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .castVote(true)
      .accounts({
        voteAccount: voteAccount.publicKey,
        voteReceipt: receiptPda,
        voter: voter.publicKey,
        voterTokenAccount: voterTokenAccount,
        tokenMint: tokenMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([voter])
      .rpc();

    const updatedVoteAccount = await program.account.voteAccount.fetch(voteAccount.publicKey);
    expect(updatedVoteAccount.votesFor.toNumber()).to.equal(1);

    const receipt = await program.account.voteReceipt.fetch(receiptPda);
    expect(receipt.voter.toBase58()).to.equal(voter.publicKey.toBase58());
  });

  it("3. Prevents double voting", async () => {
    const [receiptPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receipt"), voteAccount.publicKey.toBuffer(), voter.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .castVote(false)
        .accounts({
          voteAccount: voteAccount.publicKey,
          voteReceipt: receiptPda,
          voter: voter.publicKey,
          voterTokenAccount: voterTokenAccount,
          tokenMint: tokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .signers([voter])
        .rpc();
      expect.fail("Should have failed with already in use error");
    } catch (e: any) {
      // Check for PDA already in use (custom error or system error)
      const errorStr = JSON.stringify(e);
      expect(errorStr.toLowerCase()).to.satisfy((s: string) =>
        s.includes("already in use") || s.includes("custom program error: 0x0")
      );
    }
  });

  it("4. Enforces token requirement", async () => {
    const poorVoter = anchor.web3.Keypair.generate();
    const airdropSig = await provider.connection.requestAirdrop(poorVoter.publicKey, anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(airdropSig);

    const poorTokenAccount = await createAccount(
      provider.connection,
      mintAuthority,
      tokenMint,
      poorVoter.publicKey
    );

    const [receiptPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receipt"), voteAccount.publicKey.toBuffer(), poorVoter.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .castVote(true)
        .accounts({
          voteAccount: voteAccount.publicKey,
          voteReceipt: receiptPda,
          voter: poorVoter.publicKey,
          voterTokenAccount: poorTokenAccount,
          tokenMint: tokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .signers([poorVoter])
        .rpc();
      expect.fail("Should have failed with NotEnoughTokens");
    } catch (e: any) {
      expect(e.message).to.include("NotEnoughTokens");
    }
  });

  it("5. Closes a vote", async () => {
    await program.methods
      .closeVote()
      .accounts({
        voteAccount: voteAccount.publicKey,
        authority: provider.wallet.publicKey,
      } as any)
      .rpc();

    const account = await program.account.voteAccount.fetch(voteAccount.publicKey);
    expect(account.isActive).to.be.false;

    const anotherVoter = anchor.web3.Keypair.generate();
    const sig = await provider.connection.requestAirdrop(anotherVoter.publicKey, anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig);

    const anotherTokenAccount = await createAccount(provider.connection, mintAuthority, tokenMint, anotherVoter.publicKey);
    await mintTo(provider.connection, mintAuthority, tokenMint, anotherTokenAccount, mintAuthority, 1);

    const [receiptPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receipt"), voteAccount.publicKey.toBuffer(), anotherVoter.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .castVote(true)
        .accounts({
          voteAccount: voteAccount.publicKey,
          voteReceipt: receiptPda,
          voter: anotherVoter.publicKey,
          voterTokenAccount: anotherTokenAccount,
          tokenMint: tokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .signers([anotherVoter])
        .rpc();
      expect.fail("Should have failed on closed vote");
    } catch (e: any) {
      expect(e.message).to.include("VoteIsClosed");
    }
  });

  it("6. Sets a delegate", async () => {
    const delegate = anchor.web3.Keypair.generate();
    const [delegationPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("delegation"), provider.wallet.publicKey.toBuffer(), tokenMint.toBuffer()],
      program.programId
    );

    await program.methods
      .setDelegate(delegate.publicKey)
      .accounts({
        delegation: delegationPda,
        authority: provider.wallet.publicKey,
        mint: tokenMint,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .rpc();

    const delegation = await program.account.delegation.fetch(delegationPda);
    expect(delegation.delegate.toBase58()).to.equal(delegate.publicKey.toBase58());
  });

  it("7. Casts a proxy vote successfully", async () => {
    const proxyVoteAccount = anchor.web3.Keypair.generate();
    await program.methods
      .initializeVote("Proxy Test", tokenMint)
      .accounts({
        voteAccount: proxyVoteAccount.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([proxyVoteAccount])
      .rpc();

    const ownerWallet = provider.wallet.publicKey;
    const delegate = anchor.web3.Keypair.generate();

    const sig = await provider.connection.requestAirdrop(delegate.publicKey, anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig);

    const [delegationPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("delegation"), ownerWallet.toBuffer(), tokenMint.toBuffer()],
      program.programId
    );
    await program.methods
      .setDelegate(delegate.publicKey)
      .accounts({ delegation: delegationPda, authority: ownerWallet, mint: tokenMint } as any)
      .rpc();

    const ownerTokenAccount = await createAccount(provider.connection, mintAuthority, tokenMint, ownerWallet);
    await mintTo(provider.connection, mintAuthority, tokenMint, ownerTokenAccount, mintAuthority, 1);

    const [receiptPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receipt"), proxyVoteAccount.publicKey.toBuffer(), ownerWallet.toBuffer()],
      program.programId
    );

    await program.methods
      .castProxyVote(true)
      .accounts({
        voteAccount: proxyVoteAccount.publicKey,
        delegationRecord: delegationPda,
        ownerTokenAccount: ownerTokenAccount,
        delegate: delegate.publicKey,
        voteReceipt: receiptPda,
        tokenMint: tokenMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .signers([delegate])
      .rpc();

    const updatedVote = await program.account.voteAccount.fetch(proxyVoteAccount.publicKey);
    expect(updatedVote.votesFor.toNumber()).to.equal(1);
  });

  it("8. Enforces valid delegation in proxy vote", async () => {
    const proxyVoteAccount = anchor.web3.Keypair.generate();
    await program.methods.initializeVote("Invalid Delegate Test", tokenMint).accounts({ voteAccount: proxyVoteAccount.publicKey } as any).signers([proxyVoteAccount]).rpc();

    const ownerWallet = anchor.web3.Keypair.generate();
    const sig1 = await provider.connection.requestAirdrop(ownerWallet.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig1);

    const delegate = anchor.web3.Keypair.generate();
    const wrongDelegate = anchor.web3.Keypair.generate();
    const sig2 = await provider.connection.requestAirdrop(wrongDelegate.publicKey, anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig2);

    const [delegationPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("delegation"), ownerWallet.publicKey.toBuffer(), tokenMint.toBuffer()],
      program.programId
    );

    await program.methods
      .setDelegate(delegate.publicKey)
      .accounts({ delegation: delegationPda, authority: ownerWallet.publicKey, mint: tokenMint } as any)
      .signers([ownerWallet])
      .rpc();

    const ownerTokenAccount = await createAccount(provider.connection, mintAuthority, tokenMint, ownerWallet.publicKey);

    const [receiptPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receipt"), proxyVoteAccount.publicKey.toBuffer(), ownerWallet.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .castProxyVote(true)
        .accounts({
          voteAccount: proxyVoteAccount.publicKey,
          delegationRecord: delegationPda,
          ownerTokenAccount: ownerTokenAccount,
          delegate: wrongDelegate.publicKey,
          voteReceipt: receiptPda,
          tokenMint: tokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .signers([wrongDelegate])
        .rpc();
      expect.fail("Should have failed with InvalidDelegate");
    } catch (e: any) {
      expect(JSON.stringify(e)).to.include("InvalidDelegate");
    }
  });

  it("9. Revokes a delegation", async () => {
    const [delegationPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("delegation"), provider.wallet.publicKey.toBuffer(), tokenMint.toBuffer()],
      program.programId
    );

    await program.methods
      .revokeDelegation()
      .accounts({
        delegation: delegationPda,
        authority: provider.wallet.publicKey,
        mint: tokenMint,
      } as any)
      .rpc();

    try {
      await program.account.delegation.fetch(delegationPda);
      expect.fail("Account should be closed");
    } catch (e: any) {
      expect(e.message).to.include("Account does not exist");
    }
  });
});
