<p align="center">
  <img 
    width="200" 
    alt="Ballpit Logo" 
    src="docs/images/logo-full.png" 
  />
</p>

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)
![Solana](https://img.shields.io/badge/Solana-1.18-14F195?logo=solana&logoColor=white)
![Anchor](https://img.shields.io/badge/Anchor-0.30-6B46C1?logo=rust&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)
![Event](https://img.shields.io/badge/Unsubmitted-BadgerBuild%20Hackathon-FFD700)

Ballpit is a blockchain-based shareholder voting platform that tokenizes corporate shares on Solana to enable secure, transparent, and immutable governance. It replaces traditional paper-based proxy voting with a hybrid architecture combining off-chain KYC verification with on-chain cryptographic audit trails.

### Research Context

Ballpit addresses well-documented challenges in traditional corporate governance systems where **[shareholder participation is low, proxy voting is opaque, and vote manipulation risks exist](https://stanford-jblp.pubpub.org/pub/blockchain-and-public-companies)**. Companies like **[Nasdaq](https://ir.nasdaq.com/news-releases/news-release-details/nasdaq-deliver-blockchain-e-voting-solution-strate)** and **[Corporify](https://en.wikipedia.org/wiki/Corporify)** have piloted blockchain voting solutions, but these systems remain costly, complex, and often require significant infrastructure investment.

### How Ballpit Works

Ballpit extends traditional corporate governance into a transparent, auditable system by leveraging an end-to-end KYC → Token Minting → On-Chain Voting pipeline:

1. **Identity Verification Layer (KYC Service)**
   Companies verify shareholder identities off-chain.
2. **Token Issuance Layer (SPL Token Minting)**
   Backend mints tokenized shares as SPL tokens on Solana (one token = one vote).
3. **Governance Layer (Anchor Smart Contract)**
   Shareholders vote on-chain via VoteAccounts (ballot boxes) with weighted voting and delegation.
4. **Audit Layer (Real Name Registry)**
   Off-chain mapping of wallet addresses to verified identities for compliance and audit trails.


<details>
  <summary><b>View Screenshots</b></summary>
  <br>

| Landing Page | Admin Dashboard | Voting Dashboard | Transaction Record |
| :---: | :---: | :---: | :---: |
| <img src="docs/images/landing_page.png" width="100%"> | <img src="docs/images/admin_dashboard.png" width="100%"> | <img src="docs/images/voting_dashboard.png" width="100%"> | <img src="docs/images/transaction_record.png" width="100%"> |

</details>

## Key Features

- **Immutable Audit Trail**: Every vote is signed and recorded on Solana, creating a permanent, tamper-proof record.
- **Real-Time Finality**: Instant vote tallying and results via blockchain state updates (sub-second latency).
- **Proxy Delegation**: Cryptographically secured delegation chains allowing trustless proxy voting.
- **Double-Vote Protection**: Deterministic PDA seeds (Program Derived Addresses) prevent duplicate voting at the protocol level.
- **Cost Efficiency**: High-throughput voting at a fraction of the cost of traditional proxy services (~$0.000005/vote).

## Documentation

- **[SETUP.md](docs/SETUP.md)**: Environment configuration and installation.
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: System design and sequence diagrams.
- **[API.md](docs/API.md)**: REST API and Smart Contract specification.
- **[STYLE.md](docs/STYLE.md)**: Coding standards and project conventions.

## License

See **[LICENSE](LICENSE)** file for details.