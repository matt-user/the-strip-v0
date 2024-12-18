use fuels::{
    prelude::*,
    types::Identity,
};

use crate::liquidity_pool::get_contract_instance;

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
