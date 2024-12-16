contract;

use std::{block::timestamp, bytes::Bytes, hash::Hash, storage::storage_vec::StorageVec};
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

configurable {
    OWNER: Identity = Identity::Address(Address::from(0x656A68f0d8Fb82505BCD2bE28F6B7600cf427D828f3E3F9AAcdEf03a12D8f16C)),
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

// TODO: make this generalizable
enum Options {
    home: (),
    away: (),
    draw: (),
}

struct Times {
    maturity: u64,
    expiry: u64,
}

struct GameDetails {
    game_id: Bytes,
    game_label: str[64],
}

enum Outcome {
    BLUE: (),
    GREEN: (),
    YELLOW: (),
    RED: ()
}

abi Game {
    #[storage(write)]
    fn initialize(new_owner: Option<Identity>);
    
    // User sends USD to place bet on outcome of game
    // call needs to include liquidity pool
    #[storage(write, read)]
    fn place_bet(outcome: Outcome);
    
    // Request the contract to generate a random number
    // locks bets, no users can place bets after this function call
    // restricted to the owner
    #[storage(write, read)]
    fn request_random(seed: b256);

    // Fulfill the random number request
    // payout bets and send remaining collateral to liquidity pool
    #[storage(write, read)]
    fn fulfill_random();
}

impl Game for Contract {
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

    #[storage(write, read)]
    fn place_bet(outcome: Outcome) {

    }

    #[storage(write, read)]
    fn request_random(seed: b256) {

    }

    #[storage(write, read)]
    fn fulfill_random() {
        
    }
}
