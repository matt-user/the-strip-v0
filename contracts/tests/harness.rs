use std::{str::FromStr, time::Duration};

use chrono::DateTime;
use fuels::{
    prelude::*,
    types::{ContractId, Identity},
};

// Load abi from json
abigen!(Contract(
    name = "LiquidityPool",
    abi = "./liquidity_pool/out/debug/liquidity_pool-abi.json"
));

async fn get_contract_instance() -> (LiquidityPool<WalletUnlocked>, ContractId) {
    let node_config = NodeConfig {
        utxo_validation: false,
        block_production: Trigger::Interval {
            block_time: Duration::from_secs(1),
        },
        ..NodeConfig::default()
    };
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

#[tokio::test]
async fn can_get_uninitialized_owner() {
    let (instance, _id) = get_contract_instance().await;

    let owner = instance
        .methods()
        .owner()
        .simulate(Execution::StateReadOnly)
        .await
        .unwrap()
        .value;

    assert_eq!(owner, State::Uninitialized);
}

#[tokio::test]
async fn can_initialize_owner() {
    let (instance, _id) = get_contract_instance().await;

    let _ = instance.methods().initialize(None).call().await.unwrap();

    let owner = instance.methods().owner().call().await.unwrap().value;

    let correct_owner = Identity::Address(
        Address::from_str("0x656A68f0d8Fb82505BCD2bE28F6B7600cf427D828f3E3F9AAcdEf03a12D8f16C")
            .unwrap(),
    );
    assert_eq!(owner, State::Initialized(correct_owner));
}

#[tokio::test]
async fn can_initialize_new_owner() {
    let (instance, _id) = get_contract_instance().await;

    let new_owner = Identity::Address(instance.account().address().into());

    let _ = instance
        .methods()
        .initialize(Some(new_owner))
        .call()
        .await
        .unwrap();

    let owner = instance.methods().owner().call().await.unwrap().value;

    assert_eq!(owner, State::Initialized(new_owner));
}

#[tokio::test]
async fn contract_is_initially_unpaused() {
    let (instance, _id) = get_contract_instance().await;

    let is_paused = instance
        .methods()
        .is_paused()
        .simulate(Execution::StateReadOnly)
        .await
        .unwrap()
        .value;

    assert_eq!(is_paused, false);
}

#[tokio::test]
#[should_panic]
async fn can_not_pause_contract_as_non_owner() {
    let (instance, _id) = get_contract_instance().await;

    let _ = instance.methods().initialize(None).call().await.unwrap();

    let _ = instance.methods().pause().call().await.unwrap();
}

#[tokio::test]
#[should_panic]
async fn can_not_unpause_contract_as_non_owner() {
    let (instance, _id) = get_contract_instance().await;

    let _ = instance.methods().initialize(None).call().await.unwrap();

    let _ = instance.methods().unpause().call().await.unwrap();
}

#[tokio::test]
async fn can_pause_contract_as_owner() {
    let (instance, _id) = get_contract_instance().await;

    let new_owner = Identity::Address(instance.account().address().into());

    let _ = instance
        .methods()
        .initialize(Some(new_owner))
        .call()
        .await
        .unwrap();

    let _ = instance.methods().pause().call().await.unwrap();
    let is_paused = instance
        .methods()
        .is_paused()
        .simulate(Execution::StateReadOnly)
        .await
        .unwrap()
        .value;

    assert_eq!(is_paused, true);
}

#[tokio::test]
async fn can_unpause_contract_as_owner() {
    let (instance, _id) = get_contract_instance().await;

    let new_owner = Identity::Address(instance.account().address().into());

    let _ = instance
        .methods()
        .initialize(Some(new_owner))
        .call()
        .await
        .unwrap();

    let _ = instance.methods().pause().call().await.unwrap();
    let _ = instance.methods().unpause().call().await.unwrap();

    let is_paused = instance
        .methods()
        .is_paused()
        .simulate(Execution::StateReadOnly)
        .await
        .unwrap()
        .value;

    assert_eq!(is_paused, false);
}

#[tokio::test]
async fn can_start_vault_as_owner() {
    let (instance, _id) = get_contract_instance().await;

    let new_owner = Identity::Address(instance.account().address().into());

    let _ = instance
        .methods()
        .initialize(Some(new_owner))
        .call()
        .await
        .unwrap();

    let response = instance.methods().start_vault().call().await.unwrap();

    let round_started_log = response.decode_logs_with_type::<RoundStarted>().unwrap();
    assert_eq!(round_started_log, vec![RoundStarted { round: 1 }]);

    let RoundInfo {
        round,
        has_vault_started,
        round_start_time: _,
    } = instance
        .methods()
        .current_round_info()
        .simulate(Execution::StateReadOnly)
        .await
        .unwrap()
        .value;
    assert_eq!(round, 1);
    assert_eq!(has_vault_started, true);
}

#[tokio::test]
#[should_panic]
async fn can_not_start_vault_as_non_owner() {
    let (instance, _id) = get_contract_instance().await;

    let _ = instance.methods().initialize(None).call().await.unwrap();

    let _response = instance.methods().start_vault().call().await.unwrap();
}

#[tokio::test]
#[should_panic]
async fn can_not_start_vault_when_paused() {
    let (instance, _id) = get_contract_instance().await;

    let new_owner = Identity::Address(instance.account().address().into());

    let _ = instance
        .methods()
        .initialize(Some(new_owner))
        .call()
        .await
        .unwrap();

    let _ = instance.methods().pause().call().await.unwrap();

    let _response = instance.methods().start_vault().call().await.unwrap();
}

#[tokio::test]
#[should_panic]
async fn can_not_start_vault_when_already_started() {
    let (instance, _id) = get_contract_instance().await;

    let new_owner = Identity::Address(instance.account().address().into());

    let _ = instance
        .methods()
        .initialize(Some(new_owner))
        .call()
        .await
        .unwrap();

    let _response = instance.methods().start_vault().call().await.unwrap();
    let _response = instance.methods().start_vault().call().await.unwrap();
}

#[tokio::test]
async fn can_not_close_current_round_when_vault_has_not_started() {
    let (instance, _id) = get_contract_instance().await;

    let _ = instance.methods().initialize(None).call().await.unwrap();

    let can_close_current_round = instance
        .methods()
        .can_close_current_round()
        .simulate(Execution::StateReadOnly)
        .await
        .unwrap()
        .value;
    assert!(!can_close_current_round);
}

#[tokio::test]
async fn can_not_close_round_during_round_duration() {
    let (instance, _id) = get_contract_instance().await;

    let new_owner = Identity::Address(instance.account().address().into());

    let _ = instance
        .methods()
        .initialize(Some(new_owner))
        .call()
        .await
        .unwrap();
    let _ = instance.methods().start_vault().call().await.unwrap();
    let can_close_current_round = instance
        .methods()
        .can_close_current_round()
        .simulate(Execution::StateReadOnly)
        .await
        .unwrap()
        .value;
    assert!(!can_close_current_round);
}

#[tokio::test]
async fn can_close_round() {
    let (instance, _id) = get_contract_instance().await;

    let new_owner = Identity::Address(instance.account().address().into());

    let _ = instance
        .methods()
        .initialize(Some(new_owner))
        .call()
        .await
        .unwrap();
    let _ = instance.methods().start_vault().call().await.unwrap();

    // block time is 1s so this represents 1 week
    let blocks_to_produce = 1;
    let provider = instance.account().provider().unwrap().clone();
    let chain_info = provider.chain_info().await.unwrap();
    let current_timestamp = chain_info.latest_block.header.time.unwrap();
    provider
        .produce_blocks(
            blocks_to_produce,
            DateTime::from_timestamp(current_timestamp.timestamp() + 604800, 0),
        )
        .await
        .unwrap();

    let can_close_current_round = instance
        .methods()
        .can_close_current_round()
        .simulate(Execution::StateReadOnly)
        .await
        .unwrap()
        .value;
    assert!(can_close_current_round);
}
