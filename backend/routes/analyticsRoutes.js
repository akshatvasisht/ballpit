const express = require("express");
const router = express.Router();
const solanaService = require("../services/solanaService");
const { getMint } = require("@solana/spl-token");
const { requireAdmin } = require("./middleware");

/**
 * @route GET /api/analytics/overview
 * @desc Get aggregated analytics for the admin dashboard
 */
router.get("/overview", requireAdmin, async (req, res, next) => {
    try {
        // Fetch all votes created by the authority
        const voteAccounts = await solanaService.program.account.voteAccount.all([
            {
                memcmp: {
                    offset: 8,
                    bytes: solanaService.authorityWallet.publicKey.toBase58()
                }
            }
        ]);

        const activeProposals = voteAccounts.filter(v => v.account.isActive).length;
        const totalProposals = voteAccounts.length;

        // Fetch mint info for participation metrics
        const mintInfo = await getMint(solanaService.connection, solanaService.shareTokenMint);
        const totalSupply = Number(mintInfo.supply);

        let totalVotesCastAcrossAll = 0;
        voteAccounts.forEach(({ account }) => {
            totalVotesCastAcrossAll += Number(account.votesFor.toString()) + Number(account.votesAgainst.toString());
        });

        let aggregateParticipationRate = "0.00%";
        if (totalSupply > 0 && totalProposals > 0) {
            // Average participation across all proposals
            const totalPossibleVotes = totalSupply * totalProposals;
            aggregateParticipationRate = ((totalVotesCastAcrossAll / totalPossibleVotes) * 100).toFixed(2) + "%";
        }

        res.json({
            overview: {
                totalProposals,
                activeProposals,
                closedProposals: totalProposals - activeProposals,
                totalSupply,
                totalVotesCastAcrossAll,
                aggregateParticipationRate
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
