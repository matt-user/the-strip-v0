use fuels::{prelude::*, types::Identity};

use crate::liquidity_pool::get_contract_instance;
use crate::liquidity_pool::{RoundInfo, RoundStarted};

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
    assert_eq!(round_started_log, vec![RoundStarted { round: 1, round_collateral: 0 }]);

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
async fn start_vault_moves_deposits_to_collateral() {
    let (instance, _id) = get_contract_instance().await;

    let new_owner = Identity::Address(instance.account().address().into());

    let _ = instance
        .methods()
        .initialize(Some(new_owner))
        .call()
        .await
        .unwrap();

    let deposit_amount = 1000;
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

    let response = instance.methods().start_vault().call().await.unwrap();

    let round_started_log = response.decode_logs_with_type::<RoundStarted>().unwrap();
    assert_eq!(
        round_started_log,
        vec![RoundStarted {
            round: 1,
            round_collateral: deposit_amount
        }]
    );

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
