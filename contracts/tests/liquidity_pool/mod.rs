use fuels::{
    prelude::*,
    types::ContractId,
};

mod owner;
mod pause;
mod start_vault;
mod deposit;
mod can_close_round;
mod close_round;

// Load abi from json
abigen!(Contract(
    name = "LiquidityPool",
    abi = "./liquidity_pool/out/debug/liquidity_pool-abi.json"
));

async fn get_contract_instance() -> (LiquidityPool<WalletUnlocked>, ContractId) {
    // Launch a local network and deploy the contract
    let mut wallets = launch_custom_provider_and_get_wallets(
        WalletsConfig::new(
            Some(1),             /* Single wallet */
            Some(1),             /* Single coin (UTXO) */
            Some(1_000_000_000), /* Amount per coin */
        ),
        None,
        None,
    )
    .await
    .unwrap();
    let wallet = wallets.pop().unwrap();

    let id = Contract::load_from(
        "./liquidity_pool/out/debug/liquidity_pool.bin",
        LoadConfiguration::default(),
    )
    .unwrap()
    .deploy(&wallet, TxPolicies::default())
    .await
    .unwrap();

    let instance = LiquidityPool::new(id.clone(), wallet);

    (instance, id.into())
}
