use fuels::{
    prelude::*,
    types::Identity,
};

use crate::liquidity_pool::get_contract_instance;

// TODO finish test
#[tokio::test]
async fn can_deposit() {
    let (instance, _id) = get_contract_instance().await;

    let new_owner = Identity::Address(instance.account().address().into());

    let _ = instance
        .methods()
        .initialize(Some(new_owner))
        .call()
        .await
        .unwrap();

    let _ = instance
        .methods()
        .deposit()
        .call_params(CallParameters::new(1, AssetId::zeroed(), 1000))
        .unwrap()
        .call()
        .await
        .unwrap();
}

#[tokio::test]
#[should_panic]
async fn can_not_deposit_wrong_asset() {
    let (instance, _id) = get_contract_instance().await;

    let new_owner = Identity::Address(instance.account().address().into());

    let _ = instance
        .methods()
        .initialize(Some(new_owner))
        .call()
        .await
        .unwrap();

    let _ = instance.methods().deposit().call().await.unwrap();
}
