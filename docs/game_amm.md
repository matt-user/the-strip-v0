# Game AMM

The Game AMM seeds the Game Market Manager with collateral to exchange for winning outcome tokens, once a market is resolved.  The Game AMM is whitelisted to automatically mint outcome tokens for game markets by depositing USD collateral from the liquidity pool to individual game markets.

`buy_from_amm_quote` and `buy_from_amm` must be called before the AMM can mint outcome tokens.

```rust
// Returns pricing information about a position.
// It is seeded from an Oracle or contract.
// Params:
//  market: id of the game that the position is from
//  position: name of the position to take for the specified game
//  amount: amount of outcome tokens requested for specified position.
//          This is needed to calculate the Skew impact/discount for the quote.
fn buy_from_amm_quote(market: Bytes, position: String, amount: u256) -> u256;

// Buys from the amm
// Params:
//  market: id of the game that the position is from
//  position: name of the position to take for the specified game
//  amount: amount of outcome tokens requested for specified position
//  expected payout: amount of collateral that can be claimed for a winning positions
//  additional slippage: amount of slippage to include in the transaction as a risk management measure
fn buy_from_amm(market: Bytes, position: String, amount: u256, expected_payout: u256, additional_slippage: u256);
```

`buy_from_amm` does the following:

* take the buy-in amount of USD from user
* take USD required to collateralize users' request from the Liquidity pool contract
* use the USD taken from the pool to mint an equal amount of SRC 20 outcome tokens requested by the user
* send a percentage of USD from the user's buy-in to the SafeBox, determined by the `safe_box_impact` parameter
* sends the remaining amount of USD from the user's buy-in to the liquidity pool contract.

The AMM has risk management mechanics to keep it from offering positions that could expose the protocol to an unacceptable amount of downside risk.

Risk Management:

* `cap_per_market` - threshold of how much risk the AMM allows itself to take per game market.  Denominated in USD
* `skew` - A per-market premium or discount on top of the default pricing/odds.  Based on the amount of current risk taken by the AMM
* `max/min_supported_odds` - Determines the max and min price of any position that the AMM can provide liquidity for.
