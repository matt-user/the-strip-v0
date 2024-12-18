library;

pub enum LiquidityPoolError {
    /// Emitted when a vault has already started.
    VaultAlreadyStarted: (),
    /// Emitted if a round can not be closed.
    CannotCloseCurrentRound: (),
    /// Emitted if the deposited asset is not DEPOSITED_ASSET_ID
    WrongDepositedAsset: (),
    /// Emitted when a vault should be started before signaling withdrawal
    VaultNotStarted: (),
    /// Emitted when a user signaling a withdrawal has no collateral
    NoCollateralInVault: (),
    /// Emitted when a user signals a withdrawal during the current round
    MustSignalWithdrawalAfterRoundCompletion: (),
    /// Emitted when a user signals a withdrawal < 10% of their collateral
    WithdrawalMustBeLarger: (),
    /// Emitted when a user signals a withdrawal > their collateral
    WithdrawalMustBeSmaller: (),
    /// Emitted when a user tries to withdraw before completion of current round
    MustWithdrawAfterRoundCompletion: (),
    /// Emitted when a user that has no funds available to withdraw tries to withdraw
    NoFundsToWithdraw: (),
    /// Emitted when invalid contract/eoa calls the request_collateral function
    CannotRequestCollateral: (),
    /// Emitted when the game contract calls request_collateral with an amount > available_collateral
    MustRequestCollateralLessThanTotal: (),
    /// Emitted when an unauthorized contract/eoa tries to deposit unused collateral
    CannotDepositCollateral: (),
    /// Emitted when the deposited collateral is 0
    DepositedAmountGt0: (),
}

/// Logged when a new round is started
struct RoundStarted {
    /// The new round starting
    pub round: u64,
    /// The collateral in the round
    pub round_collateral: u64,
}

/// Logged when a user deposits funds
struct Deposit {
    /// The amount deposited
    pub amount: u64,
}

/// Represents round info
struct RoundInfo {
    /// Round number
    pub round: u64,
    /// Has vault started
    pub has_vault_started: bool,
    /// Timestamp of round start
    pub round_start_time: u64,
}

abi LiquidityPool {
    #[storage(write)]
    fn initialize(new_owner: Identity, game_contract_id: ContractId);

    #[storage(read, write)]
    fn start_vault();

    #[storage(read)]
    fn current_round_info() -> RoundInfo;

    #[storage(read, write)]
    fn close_round();

    #[storage(read, write)]
    fn can_close_current_round() -> bool;

    #[storage(read, write)]
    #[payable]
    fn deposit();

    #[storage(read)]
    fn deposit_for_user() -> u64;

    #[storage(read)]
    fn total_deposits() -> u64;

    #[storage(read, write)]
    fn request_collateral(amount: u64) -> Result<(), LiquidityPoolError>;

    #[storage(read, write)]
    fn signal_withdrawal(amount: u64);

    #[storage(read, write)]
    fn withdrawal();

    #[storage(read, write)]
    fn send_remaining_collateral() -> Result<(), LiquidityPoolError>;

    #[storage(read)]
    fn available_collateral() -> u64;
}