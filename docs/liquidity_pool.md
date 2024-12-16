# Liquidity Pool

Stablecoins are deposited in order to collateralize the AMM on a weekly round basis.  A single game can only belong to 1 round, which is defined based on the maturity date of the market.

When a round ends the AMM's performance from all markets is summed up and allocated to all liquidity providers proportional to their share of the pool.

Each round lasts 7 days.  Users can deposit any time during the round.  The deposited funds will be utilized as collateral in the AMM starting in the next round from time of depositing.

Deposited funds will roll over to the next round automatically until a withdrawal is signaled.  Users can signal a withdrawal at any time and are limited to no less than 10% of your total deposit.

Funds that are signaled for withdrawal will be unlocked at the start of the next round from the time of signaling.
