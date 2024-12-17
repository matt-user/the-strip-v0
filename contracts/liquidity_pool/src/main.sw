contract;

use std::{block::timestamp, hash::Hash, storage::storage_vec::*, vec::*};
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
    OWNER: Identity = Identity::Address(Address::from(0x656A68f0d8Fb82505BCD2bE28F6B7600cf427D828f3E3F9AAcdEf03a12D8f16C)),
}

storage {
    has_vault_started: bool = false,
    current_round: u64 = 0,
    round_start_time: StorageMap<u64, u64> = StorageMap::<u64, u64> {},
    trading_markets_per_round: StorageMap<u64, StorageVec<ContractId>> = StorageMap::<u64, StorageVec<ContractId>> {},
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
}

/// Logged when a new round is started
struct RoundStarted {
    /// The new round starting
    pub round: u64,
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
    fn initialize(new_owner: Option<Identity>);

    #[storage(read, write)]
    fn start_vault();

    #[storage(read)]
    fn current_round_info() -> RoundInfo;

    #[storage(read, write)]
    fn close_round();

    #[storage(read, write)]
    fn can_close_current_round() -> bool;

    #[storage(read, write)]
    fn request_collateral(amount: u64);

    #[storage(read, write)]
    fn signal_withdrawal(amount: u64);

    #[storage(read, write)]
    fn withdrawal();
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
    /// * Writes: `1`
    #[storage(write)]
    fn initialize(new_owner: Option<Identity>) {
        match new_owner {
            None => initialize_ownership(OWNER),
            Some(new_owner) => initialize_ownership(new_owner),
        }
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
    /// * Reads: `1`
    /// * Writes: `3`
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

        log(RoundStarted { round });
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
    /// This function also exercises options and closes markets.
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

        // Exercise market options
    }

    #[storage(read, write)]
    fn can_close_current_round() -> bool {
        can_close_current_round()
    }

    #[storage(read, write)]
    fn request_collateral(amount: u64) {
    }

    #[storage(read, write)]
    fn signal_withdrawal(amount: u64) {
    }

    #[storage(read, write)]
    fn withdrawal() {
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

    let trading_markets = storage.trading_markets_per_round.get(round).load_vec();

    let mut i = 0;
    while i < trading_markets.len() {
        let market_address = trading_markets.get(i).unwrap();
        //let positional_market = abi(Game, market_address.into());
    }

    return true;
}

#[test]
fn owner_uninitialized() {
    let owner_contract = abi(SRC5, CONTRACT_ID);
    let owner = owner_contract.owner();

    assert(owner == State::Uninitialized);
}

//#[test]
// fn can_initialize_owner() {
//     let owner_contract = abi(SRC5, CONTRACT_ID);
//     let liquidity_pool_contract = abi(LiquidityPool, CONTRACT_ID);

//     liquidity_pool_contract.initialize();
//     let owner = owner_contract.owner();

//     assert(owner == State::Initialized(OWNER));
// }


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
