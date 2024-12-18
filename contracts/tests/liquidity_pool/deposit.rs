use fuels::{prelude::*, types::Identity};

use crate::liquidity_pool::get_contract_instance;

// TODO finish test
#[tokio::test]
async fn can_deposit() {
    let (instance, id) = get_contract_instance().await;

    let account = instance.account();
    let new_owner_address = account.address().into();
    let new_owner = Identity::Address(new_owner_address);

    let _ = instance
        .methods()
        .initialize(Some(new_owner))
        .call()
        .await
        .unwrap();

    let deposit_amount = 1000;
    let provider = account.provider().unwrap();

    let _response = instance
        .methods()
        .deposit()
        .call_params(CallParameters::new(
            deposit_amount,
            AssetId::zeroed(),
            100_000,
        ))
        .unwrap()
        .call()
        .await
        .unwrap();

    let post_deposit_contract_balances = provider.get_contract_balances(&id.into()).await.unwrap();
    let post_deposit_contract_balance = post_deposit_contract_balances
        .get(&AssetId::zeroed())
        .unwrap_or(&0);

    assert_eq!(*post_deposit_contract_balance, deposit_amount);
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
