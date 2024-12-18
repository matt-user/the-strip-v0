use std::str::FromStr;
use fuels::{
    prelude::*,
    types::Identity,
};

use crate::liquidity_pool::State;
use crate::liquidity_pool::get_contract_instance;

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
