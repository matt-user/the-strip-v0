# Game Market Manager

The game market manager is a multi-asset SRC 20 contract.  It acts similar to an escrow.  Each game will have its own id.  The game will temporarily hold collateral in return for newly minted SRC 20 outcome tokens.  These outcome tokens are unique to their particular game.  There are different SRC 20 tokens for each possible outcome for the game.  For example, game markets can offer HOME WIN, AWAY WIN, and DRAW.  Or spreads, such as ABOVE or BELOW.

Only the Game AMM contract can mint outcome tokens.  Winning bettors can exchange outcome tokens for the USD held in the Game Market contract.  We can use Pinnacle and/or Optic Odds to provide pricing data.

We pull odds in from an Oracle.  The Oracle could also be the game contract itself.

```rust
struct GameCreate {
    game_id: Bytes,
    start_time: u256,
    outcomes: Vec<GameOutcome>
}

struct GameOutcome {
    outcome_odds: i32.
    outcome_name: String
}
```

A game must be resolved for traders to redeem winning outcome tokens for USD.  After a game ends a request is made to an oracle (or game contract) to get the data required to resolve a game.

```rust
struct GameResolve {
    game_id: Bytes,
    outcome_name: String,
}
```

Games are always holding the same amount of USD as there are winning SRC 20 outcome tokens in circulation.  This is to ensure positions are always fully collateralized at any point in time.
