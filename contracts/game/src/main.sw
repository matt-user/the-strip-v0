contract;

use std::{
    asset::transfer,
    block::height,
    block::timestamp,
    bytes::Bytes,
    call_frames::msg_asset_id,
    context::msg_amount,
    hash::Hash,
    storage::storage_vec::*,
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
use vrf_abi::{randomness::RandomnessState, Vrf};
use liquidity_pool_abi::*;
use std::array_conversions::b256::*;

const VRF_ADDR = 0x749a7eefd3494f549a248cdcaaa174c1a19f0c1d7898fa7723b6b2f8ecc4828d;

configurable {
    LIQUIDITY_POOL: ContractId = ContractId::from(0x749a7eefd3494f549a248cdcaaa174c1a19f0c1d7898fa7723b6b2f8ecc4828d),
    // TODO: change name to DEPOSIT_ASSET_ID
    BASE_ASSET: AssetId = AssetId::zero(),
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
    RED: (),
}

impl Outcome {
    fn equal(self, other: Outcome) -> bool {
        match (self, other) {
            (Outcome::GREEN, Outcome::GREEN) => true,
            (Outcome::BLUE, Outcome::BLUE) => true,
            (Outcome::YELLOW, Outcome::YELLOW) => true,
            (Outcome::RED, Outcome::RED) => true,
            _ => false,
        }
    }
}

enum GameError {
    MaturityNotReached: (),
    NotEnoughFundsDraw: (u64, u64),
    WrongAssetDraw: (),
    RequestNotDone: (),
}

abi Game {
    #[storage(write)]
    fn initialize(new_owner: Identity);

    // User sends USD to place bet on outcome of game
    // call needs to include liquidity pool
    #[storage(write, read)]
    #[payable]
    fn place_bet(outcome: Outcome) -> Result<(), LiquidityPoolError>;

    // Request the contract to generate a random number
    // locks bets, no users can place bets after this function call
    // restricted to the owner
    #[storage(write, read)]
    #[payable]
    fn request_random(seed: b256);

    // Fulfill the random number request
    // payout bets and send remaining collateral to liquidity pool
    #[storage(write, read)]
    fn fulfill_random() -> Result<(), LiquidityPoolError>;

    // Get all the bets
    #[storage(read)]
    fn get_all_bets() -> Vec<(Identity, Outcome, u64)>;
}

storage {
    bets: StorageVec<(Identity, Outcome, u64)> = StorageVec {},
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
    fn initialize(new_owner: Identity) {
        initialize_ownership(new_owner);
    }

    #[storage(write, read)]
    #[payable]
    fn place_bet(outcome: Outcome) -> Result<(), LiquidityPoolError> {
        require_not_paused();
        assert(msg_asset_id() == BASE_ASSET);
        assert(msg_amount() > 0);
        assert(storage.request_id.read().is_none());
        let liquidity_pool = abi(LiquidityPool, LIQUIDITY_POOL.into());
        let res = liquidity_pool.request_collateral(msg_amount() * 3);
        match res {
            Ok(_) => {},
            Err(err) => return Err(err),
        };
        storage
            .bets
            .push((msg_sender().unwrap(), outcome, msg_amount()));
        Ok(())
    }

    #[storage(write, read)]
    #[payable]
    fn request_random(seed: b256) {
        only_owner();
        require(
            height() > storage
                .start_block_height
                .read() + MATURITY,
            GameError::MaturityNotReached,
        );
        require(msg_asset_id() == AssetId::base(), GameError::WrongAssetDraw);
        let amount = msg_amount();
        let vrf = abi(Vrf, VRF_ADDR);
        let cost = vrf.get_fee(AssetId::base());
        if amount < cost {
            log(GameError::NotEnoughFundsDraw((amount, cost)));
            revert(3);
        }
        let id = vrf.request {
            gas: 1_000_000,
            asset_id: AssetId::base().bits(),
            coins: cost,
        }(seed);
        storage.request_id.write(Some(id));
    }

    #[storage(write, read)]
    fn fulfill_random() -> Result<(), LiquidityPoolError> {
        require(
            storage
                .request_id
                .read()
                .is_some(),
            GameError::RequestNotDone,
        );

        let id = storage.request_id.read().unwrap();
        let randomness = abi(Vrf, VRF_ADDR).get_request_by_num(id).unwrap().state;
        let random_number = match randomness {
            RandomnessState::Fulfilled(fulfilled) => fulfilled.randomness,
            _ => revert(5),
        };

        let test_value: u8 = random_number.bits()[0].to_be_bytes()[0] % 4;
        log(test_value);
        let outcome = match test_value {
            0 => Outcome::BLUE,
            1 => Outcome::GREEN,
            2 => Outcome::YELLOW,
            3 => Outcome::RED,
            _ => revert(4),
        };
        let mut money_left = 0;
        let mut i = 0;
        while i < storage.bets.len() {
            let (identity, user_outcome, amount) = storage.bets.get(i).unwrap().read();
            if user_outcome.equal(outcome) {
                transfer(identity, BASE_ASSET, amount * 4);
            } else {
                money_left = money_left + (amount * 4);
            }
            i += 1;
        }
        let liquidity_pool = abi(LiquidityPool, LIQUIDITY_POOL.into());
        let res = liquidity_pool.send_remaining_collateral {
            gas: 10_000_000,
            asset_id: BASE_ASSET.bits(),
            coins: money_left,
        }();
        match res {
            Ok(_) => {},
            Err(err) => {log(err); return  Err(err);},
        };
        storage.bets.clear();
        storage.request_id.write(None);
        Ok(())
    }

    #[storage(read)]
    fn get_all_bets() -> Vec<(Identity, Outcome, u64)> {
        let mut bets = Vec::new();
        let mut i = 0;
        while i < storage.bets.len() {
            bets.push(storage.bets.get(i).unwrap().read());
            i += 1;
        }
        return bets;
    }
}
