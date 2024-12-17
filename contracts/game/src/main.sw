contract;

use std::{block::timestamp,
    call_frames::msg_asset_id,
    context::msg_amount,
    block::height,
 bytes::Bytes, hash::Hash, storage::storage_vec::StorageVec};
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
use vrf_abi::Vrf;

const VRF_ADDR = 0x749a7eefd3494f549a248cdcaaa174c1a19f0c1d7898fa7723b6b2f8ecc4828d;
const BASE_ASSET: AssetId = AssetId::from(0x9ae5b658754e096e4d681c548daf46354495a437cc61492599e33fc64dcdc30c);
const LIQUIDITY_POOL = 0x749a7eefd3494f549a248cdcaaa174c1a19f0c1d7898fa7723b6b2f8ecc4828d;
configurable {
    OWNER: Identity = Identity::Address(Address::from(0x656A68f0d8Fb82505BCD2bE28F6B7600cf427D828f3E3F9AAcdEf03a12D8f16C)),
    MATURITY: u32 = 10,
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

enum Outcome {
    BLUE: (),
    GREEN: (),
    YELLOW: (),
    RED: ()
}

enum GameError {
    MaturityNotReached: (),
    NotEnoughFundsDraw: (u64, u64),
    WrongAssetDraw: (),
    RequestNotDone: (),
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

storage {
    bets: StorageMap<Identity, (Outcome, u64)> = StorageMap {},
    start_block_height: u32 = 0,
    request_id: Option<u64> = None,
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
        require_not_paused();
        assert(msg_asset_id() == BASE_ASSET);
        assert(msg_amount() > 0);
        assert(storage.request_id.read().is_none());

        storage.bets.insert(msg_sender().unwrap(), (outcome, msg_amount()));
    }

    #[storage(write, read)]
    fn request_random(seed: b256) {
        only_owner();
        require(height() > storage.start_block_height.read() + MATURITY, GameError::MaturityNotReached);
        require(msg_asset_id() == AssetId::base(), GameError::WrongAssetDraw);
        let amount = msg_amount();
        let cost = abi(Vrf, VRF_ADDR).get_fee(AssetId::base());
        if amount < cost {
            log(GameError::NotEnoughFundsDraw((amount, cost)));
            revert(3);
        }
        let id = abi(Vrf, VRF_ADDR).request(seed);
        storage.request_id.write(Some(id));
    }

    #[storage(write, read)]
    fn fulfill_random() {
        require(storage.request_id.read().is_some(), GameError::RequestNotDone);

        let id = storage.request_id.read().unwrap();
        let randomness = abi(Vrf, VRF_ADDR).get_request_by_num(id).unwrap();
    }
}
