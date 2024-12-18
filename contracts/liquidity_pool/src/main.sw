contract;

use std::{
    asset::transfer,
    block::timestamp,
    call_frames::msg_asset_id,
    context::msg_amount,
    hash::Hash,
    storage::storage_vec::*,
    vec::*,
};
use sway_libs::{
    ownership::{
        _owner,
        initialize_ownership,
        only_owner,
    },
    pausable::{
        _is_paused,
        _pause,
        _unpause,
        Pausable,
        require_not_paused,
    },
};
use standards::src5::{SRC5, State};

// 7 Days * 24 hrs * 60 min * 60 secs
const ROUND_LENGTH_SECS = 604800;

configurable {
    DEPOSIT_ASSET_ID: AssetId = AssetId::zero(),
}

storage {
    game_contract_id: ContractId = ContractId::zero(),
    has_vault_started: bool = false,
    current_round: u64 = 0,
    round_start_time: StorageMap<u64, u64> = StorageMap::<u64, u64> {},
    trading_markets_per_round: StorageMap<u64, StorageVec<ContractId>> = StorageMap::<u64, StorageVec<ContractId>> {},
    deposits: StorageMap<Identity, u64> = StorageMap {},
    total_deposits: u64 = 0,
    has_deposited: StorageMap<Identity, bool> = StorageMap {},
    deposit_keys: StorageVec<Identity> = StorageVec {},
    collateral: StorageMap<Identity, u64> = StorageMap {},
    withdraws: StorageMap<Identity, u64> = StorageMap {},
    signaled_withdraws: StorageMap<Identity, u64> = StorageMap {},
    available_collateral: u64 = 0,
}

impl SRC5 for Contract {
    #[storage(read)]
    fn owner() -> State {
        _owner()
    }
}

impl Pausable for Contract {
    #[storage(write)]
    fn pause() {
        only_owner();
        _pause();
    }

    #[storage(write)]
    fn unpause() {
        only_owner();
        _unpause();
    }

    #[storage(read)]
    fn is_paused() -> bool {
        _is_paused()
    }
}

enum LiquidityPoolError {
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
    fn request_collateral(amount: u64);

    #[storage(read, write)]
    fn signal_withdrawal(amount: u64);

    #[storage(read, write)]
    fn withdrawal();

    #[storage(read, write)]
    fn send_remaining_collateral();

    #[storage(read)]
    fn available_collateral() -> u64;
}

impl LiquidityPool for Contract {
    /// Initializes the contract owner.
    ///
    /// # Arguments
    ///
    /// * `new_owner`: [Option<Identity>] - Value to set the owner to
    ///
    /// # Reverts
    ///
    /// * When the owner is already initialized.
    ///
    /// # Number of Storage Accesses
    ///
    /// * Writes: `2`
    #[storage(write)]
    fn initialize(new_owner: Identity, game_contract_id: ContractId) {
        initialize_ownership(new_owner);
        storage.game_contract_id.write(game_contract_id);
    }

    /// Start the vault and begin round #1
    ///
    /// # Reverts
    ///
    /// * When the vault has already started.
    /// * When called by a non-owner
    /// * When the contract is paused
    ///
    /// # Number of Storage Accesses
    ///
    /// * Reads: `3 + 2n`
    /// * Writes: `5 + 2n`
    #[storage(read, write)]
    fn start_vault() {
        only_owner();
        require_not_paused();
        require(
            !storage
                .has_vault_started
                .read(),
            LiquidityPoolError::VaultAlreadyStarted,
        );

        let round = 1;
        storage.current_round.write(round);
        storage.round_start_time.insert(round, timestamp());
        storage.has_vault_started.write(true);

        let mut available_collateral = storage.available_collateral.read();
        let mut total_deposits = storage.total_deposits.read();

        let mut i = 0;
        while i < storage.deposit_keys.len() {
            let key = storage.deposit_keys.get(i).unwrap().read(); // QED, unwrap is fine
            let value = storage.deposits.get(key).read(); // QED, we won't have a bad invariant here
            storage.collateral.insert(key, value); // move deposit to collateral
            available_collateral += value;

            total_deposits -= value;

            storage.deposits.remove(key); // 0 out the deposit
            i += 1;
        }
        storage.available_collateral.write(available_collateral);
        storage.total_deposits.write(total_deposits);

        // TODO: emit event info about collateral and deposits
        log(RoundStarted {
            round,
            round_collateral: available_collateral,
        });
    }

    /// Get the current round info
    ///
    /// # Returns
    ///
    /// * [RoundInfo] - Current round info
    ///
    /// # Number of Storage Accesses
    ///
    /// * Reads: `3`
    #[storage(read)]
    fn current_round_info() -> RoundInfo {
        let round = storage.current_round.read();
        RoundInfo {
            round,
            round_start_time: storage.round_start_time.get(round).read(),
            has_vault_started: storage.has_vault_started.read(),
        }
    }

    /// Close the current round and begin the next round.
    ///
    /// # Additional Information
    ///
    /// This function moves collateral from `signaled_withdraws` to `withdraws`
    ///
    /// # Reverts
    ///
    /// * When 7 days has not passed since the beginning of the round.
    #[storage(read, write)]
    fn close_round() {
        require(
            can_close_current_round(),
            LiquidityPoolError::CannotCloseCurrentRound,
        );
        // TODO: add check that the game sent back the collateral

        // Move collateral from `signaled_withdraws` to `withdraws`
        let mut available_collateral = storage.available_collateral.read();
        let mut total_deposits = storage.total_deposits.read();

        let mut i = 0;
        while i < storage.deposit_keys.len() {
            let user = storage.deposit_keys.get(i).unwrap().read();

            // Move deposits to collateral
            let deposit = storage.deposits.get(user).read();
            let user_collateral = storage.collateral.get(user).read();
            storage.collateral.insert(user, deposit + user_collateral);
            storage.deposits.remove(user);

            total_deposits -= deposit;
            available_collateral += deposit;

            // Move signalled withdraws to withdraws
            let signaled_withdraw = storage.signaled_withdraws.get(user).read();
            let user_withdraws = storage.withdraws.get(user).read();
            storage
                .withdraws
                .insert(user, signaled_withdraw + user_withdraws);
            storage.signaled_withdraws.remove(user);

            // TODO: do we have to worry about underflows?
            available_collateral -= signaled_withdraw;

            i += 1;
        }
        storage.total_deposits.write(total_deposits);
        storage.available_collateral.write(available_collateral);
    }

    #[storage(read, write)]
    fn can_close_current_round() -> bool {
        can_close_current_round()
    }

    /// Deposit funds to be used as collateral in the next round.
    ///
    /// # Reverts:
    ///
    /// * When the deposited asset is not DEPOSIT_ASSET_ID
    /// * When contract is paused
    ///
    /// # Number of Storage Accesses
    ///
    /// Reads: `2`
    /// Writes: `3`
    #[storage(read, write)]
    #[payable]
    fn deposit() {
        require_not_paused();
        let asset_id = msg_asset_id();
        require(
            asset_id == DEPOSIT_ASSET_ID,
            LiquidityPoolError::WrongDepositedAsset,
        );

        let amount = msg_amount();

        require(amount > 0, LiquidityPoolError::DepositedAmountGt0);

        let sender = msg_sender().unwrap();

        let current_deposit = storage.deposits.get(sender).try_read().unwrap_or(0);
        let new_deposit = current_deposit + amount;
        storage.deposits.insert(sender, new_deposit);

        storage
            .total_deposits
            .write(storage.total_deposits.read() + amount);

        let has_deposited = storage.has_deposited.get(sender).try_read().unwrap_or(false);
        if (!has_deposited) {
            storage.deposit_keys.push(sender);
            storage.has_deposited.insert(sender, true);
        }

        log(Deposit {
            amount: new_deposit,
        });
    }

    /// User signals withdrawal of their collateral.
    ///
    /// # Additional Information
    ///
    /// Amount must be at least 10% of a user's total deposit
    /// A user can call `withdrawal` after the current round has closed
    ///
    /// # Reverts:
    ///
    /// * When the vault hasn't been started
    /// * When there is no collateral in the vault
    /// * When the withdrawal < 10% of collateral
    /// * When the withdrawal > collateral
    ///
    /// # Number of Storage Accesses
    ///
    /// Reads: `5`
    /// Writes: `2`
    #[storage(read, write)]
    fn signal_withdrawal(amount: u64) {
        require_not_paused();
        let vault_started = storage.has_vault_started.read();
        require(vault_started, LiquidityPoolError::VaultNotStarted);

        let round = storage.current_round.read();

        let sender = msg_sender().unwrap();

        let collateral = storage.collateral.get(sender).read();
        require(collateral > 0, LiquidityPoolError::NoCollateralInVault);
        require(
            amount > collateral / 10,
            LiquidityPoolError::WithdrawalMustBeLarger,
        );
        require(
            amount <= collateral,
            LiquidityPoolError::WithdrawalMustBeSmaller,
        );

        // storage.collateral.insert(sender, collateral - amount);
        // TODO: should we allow multiple withdrawals to be signaled?
        let signalled_withdrawal = storage.signaled_withdraws.get(sender).read();
        storage
            .signaled_withdraws
            .insert(sender, signalled_withdrawal + amount);
    }

    #[storage(read, write)]
    fn request_collateral(amount: u64) {
        require_not_paused();
        let sender = msg_sender().unwrap();
        require(
            sender == Identity::ContractId(storage.game_contract_id.read()),
            LiquidityPoolError::CannotRequestCollateral,
        );
        let available_collateral = storage.available_collateral.read();
        require(
            amount < available_collateral,
            LiquidityPoolError::MustRequestCollateralLessThanTotal,
        );
        storage
            .available_collateral
            .write(available_collateral - amount);
        transfer(sender, DEPOSIT_ASSET_ID, amount);
        // UB: sum of user's collaterals != available_collateral
    }

    /// User initiates withdrawal of their signalled withdrawal amount
    ///
    /// # Reverts:
    ///
    /// * When the vault hasn't been started
    /// * When there are no funds available for withdrawal
    ///
    ///
    /// # Number of Storage Accesses
    ///
    /// Reads: `4`
    /// Writes: `1`
    #[storage(read, write)]
    fn withdrawal() {
        require_not_paused();
        let vault_started = storage.has_vault_started.read();
        require(vault_started, LiquidityPoolError::VaultNotStarted);

        let round = storage.current_round.read();
        let sender = msg_sender().unwrap();
        let withdrawal_amount = storage.withdraws.get(sender).read();

        require(withdrawal_amount > 0, LiquidityPoolError::NoFundsToWithdraw);
        // TODO: maybe add a check here for contract balance and ensure it is > withdrawal_amount
        transfer(sender, DEPOSIT_ASSET_ID, withdrawal_amount);
        storage.withdraws.remove(sender);
        // TODO: emit event for withdrawals
    }

    // Game Contract Sends unsused collateral.
    #[storage(read, write)]
    fn send_remaining_collateral() {
        require_not_paused();

        let sender = msg_sender().unwrap();
        require(
            sender == Identity::ContractId(storage.game_contract_id.read()),
            LiquidityPoolError::CannotDepositCollateral,
        );

        let asset_id = msg_asset_id();
        require(
            asset_id == DEPOSIT_ASSET_ID,
            LiquidityPoolError::WrongDepositedAsset,
        );

        let amount = msg_amount();
        require(amount > 0, LiquidityPoolError::DepositedAmountGt0);

        let available_collateral = storage.available_collateral.read();
        storage
            .available_collateral
            .write(available_collateral + amount);
    }

    /// Get total collateral of liquidity pool
    ///
    /// # Returns
    ///
    /// * total_collatera: u64
    ///
    /// # Storage Accesses
    ///
    /// * Reads: `1`
    #[storage(read)]
    fn available_collateral() -> u64 {
        storage.available_collateral.read()
    }

    /// Get total deposits of liquidity pool
    ///
    /// # Returns
    ///
    /// * total_deposits: u64
    ///
    /// # Storage Accesses
    ///
    /// * Reads: `1`
    #[storage(read)]
    fn total_deposits() -> u64 {
        storage.total_deposits.read()
    }

    /// Get deposit of a user in liquidity_pool
    ///
    /// # Returns
    ///
    /// * deposit: u64
    ///
    /// # Storage Accesses
    ///
    /// * Reads: `1`
    #[storage(read)]
    fn deposit_for_user() -> u64 {
        let sender = msg_sender().unwrap();
        storage.deposits.get(sender).read()
    }
}

/// Checks if all conditions are met to close the round
///
/// # Returns
///
/// * [bool] - if the current round can be closed
///
/// # Number of Storage Accesses
///
/// * Reads: `2`
#[storage(read, write)]
fn can_close_current_round() -> bool {
    let round = storage.current_round.read();
    if (!storage.has_vault_started.read()
        || timestamp() < (storage.round_start_time.get(round).read() + ROUND_LENGTH_SECS))
    {
        return false;
    }

    // let trading_markets = storage.trading_markets_per_round.get(round).load_vec();

    // let mut i = 0;
    // while i < trading_markets.len() {
    //     let market_address = trading_markets.get(i).unwrap();
    //     let positional_market = abi(PositionalMarket, market_address.into());
    // }

    return true;
}

#[test]
fn owner_uninitialized() {
    let owner_contract = abi(SRC5, CONTRACT_ID);
    let owner = owner_contract.owner();

    assert(owner == State::Uninitialized);
}

#[test]
fn initially_unpaused() {
    let pausable_contract = abi(Pausable, CONTRACT_ID);

    let is_paused = pausable_contract.is_paused();

    assert(!is_paused);
}

#[test(should_revert)]
fn non_owner_can_not_pause_contract() {
    let liquidity_pool_contract = abi(LiquidityPool, CONTRACT_ID);

    liquidity_pool_contract.initialize(None);

    let pausable_contract = abi(Pausable, CONTRACT_ID);

    pausable_contract.pause();
}

#[test(should_revert)]
fn non_owner_can_not_unpause_contract() {
    let liquidity_pool_contract = abi(LiquidityPool, CONTRACT_ID);

    liquidity_pool_contract.initialize(None);

    let pausable_contract = abi(Pausable, CONTRACT_ID);

    pausable_contract.unpause();
}

// #[test]
// fn owner_can_pause_contract() {
//     let liquidity_pool_contract = abi(LiquidityPool, CONTRACT_ID);

//     let new_owner = Identity::ContractId(ContractId::from(CONTRACT_ID));

//     liquidity_pool_contract.initialize(Some(new_owner));

//     let pausable_contract = abi(Pausable, CONTRACT_ID);

//     //pausable_contract.pause();
// }
