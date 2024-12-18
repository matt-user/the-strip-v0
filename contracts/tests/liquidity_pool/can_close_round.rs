use chrono::DateTime;
use fuels::{
    prelude::*,
    types::Identity,
};

use crate::liquidity_pool::get_contract_instance;

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