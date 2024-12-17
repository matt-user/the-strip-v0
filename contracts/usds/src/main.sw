// ERC20 equivalent in Sway.
contract;
 
use standards::{
    src3::SRC3,
    src5::{
        SRC5, 
        State, 
        AccessError,
    },
    src20::{
        SetDecimalsEvent, 
        SetNameEvent, 
        SetSymbolEvent, 
        SRC20, 
        TotalSupplyEvent,
    },
};
use std::{
    asset::{
        burn,
        mint_to,
    },
    call_frames::msg_asset_id,
    constants::DEFAULT_SUB_ID,
    context::msg_amount,
    string::String,
    contract_id::ContractId
};
 
configurable {
    DECIMALS: u8 = 9u8,
    NAME: str[8] = __to_str_array("UsdStrip"),
    SYMBOL: str[4] = __to_str_array("USDS"),
}
 
storage {
    total_supply: u64 = 0,
    owner: State = State::Uninitialized,
}
 
// Native Asset Standard
impl SRC20 for Contract {
    #[storage(read)]
    fn total_assets() -> u64 {
        1
    }
 
    #[storage(read)]
    fn total_supply(asset: AssetId) -> Option<u64> {
        if asset == AssetId::default() {
            Some(storage.total_supply.read())
        } else {
            None
        }
    }
 
    #[storage(read)]
    fn name(asset: AssetId) -> Option<String> {
        if asset == AssetId::default() {
            Some(String::from_ascii_str(from_str_array(NAME)))
        } else {
            None
        }
    }
 
    #[storage(read)]
    fn symbol(asset: AssetId) -> Option<String> {
        if asset == AssetId::default() {
            Some(String::from_ascii_str(from_str_array(SYMBOL)))
        } else {
            None
        }
    }
 
    #[storage(read)]
    fn decimals(asset: AssetId) -> Option<u8> {
        if asset == AssetId::default() {
            Some(DECIMALS)
        } else {
            None
        }
    }
}
 
// Ownership Standard
impl SRC5 for Contract {
    #[storage(read)]
    fn owner() -> State {
        storage.owner.read()
    }
}
 
// Mint and Burn Standard
impl SRC3 for Contract {
    #[storage(read, write)]
    fn mint(recipient: Identity, sub_id: Option<SubId>, amount: u64) {
        require(sub_id.is_some() && sub_id.unwrap() == DEFAULT_SUB_ID, "incorrect-sub-id");
        require_access_owner();
 
        let new_supply = storage.total_supply.read() + amount;
        storage
            .total_supply
            .write(new_supply);
        mint_to(recipient, DEFAULT_SUB_ID, amount);
        
        TotalSupplyEvent::new(
            AssetId::default(), 
            new_supply, 
            msg_sender().unwrap()
        ).log();
    }
 
    #[storage(read, write)]
    #[payable]
    fn burn(sub_id: SubId, amount: u64) {
        require(sub_id == DEFAULT_SUB_ID, "incorrect-sub-id");
        require(msg_amount() >= amount, "incorrect-amount-provided");
        require(
            msg_asset_id() == AssetId::default(),
            "incorrect-asset-provided",
        );
        require_access_owner();
 
        let new_supply = storage.total_supply.read() - amount;
        storage
            .total_supply
            .write(new_supply);
        burn(DEFAULT_SUB_ID, amount);
        
        TotalSupplyEvent::new(
            AssetId::default(), 
            new_supply, 
            msg_sender().unwrap()
        ).log();
    }
}
 
abi SingleAsset {
    #[storage(read, write)]
    fn constructor(owner_: Identity);
}
 
impl SingleAsset for Contract {
    #[storage(read, write)]
    fn constructor(owner_: Identity) {
        require(storage.owner.read() == State::Uninitialized, "owner-initialized");
        storage.owner.write(State::Initialized(owner_));
    }
}
 
#[storage(read)]
fn require_access_owner() {
    require(
        storage.owner.read() == State::Initialized(msg_sender().unwrap()),
        AccessError::NotOwner,
    );
}
 
abi EmitSRC20Events {
    fn emit_src20_events();
}
 
impl EmitSRC20Events for Contract {
    fn emit_src20_events() {
        // Metadata that is stored as a configurable should only be emitted once.
        let asset = AssetId::default();
        let sender = msg_sender().unwrap();
        let name = Some(String::from_ascii_str(from_str_array(NAME)));
        let symbol = Some(String::from_ascii_str(from_str_array(SYMBOL)));
 
        SetNameEvent::new(asset, name, sender).log();
        SetSymbolEvent::new(asset, symbol, sender).log();
        SetDecimalsEvent::new(asset, DECIMALS, sender).log();
    }
}