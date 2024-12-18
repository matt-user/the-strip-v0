import { Provider, Wallet, getMintedAssetId } from 'fuels';
import { LiquidityPoolFactory } from './types/liquidity_pool/LiquidityPoolFactory';

import * as dotenv from 'dotenv'
dotenv.config()

const provider = await Provider.create(
    'https://testnet.fuel.network/v1/graphql'
  );

const wallet = Wallet.fromPrivateKey(process.env.PRIVATE_KEY!, provider);
const assetId = getMintedAssetId(process.env.USDS_CONTRACT_ADDRESS!, "0x0000000000000000000000000000000000000000000000000000000000000000");
const assetIdInput = { bits: assetId }
const configurable_consts = {
  DEPOSIT_ASSET_ID: assetIdInput
}

const deploy = await LiquidityPoolFactory.deploy(wallet, {configurableConstants: configurable_consts});
const { contract } = await deploy.waitForResult();

const addressInput = { bits: wallet.address.toB256() };
const addressIdentityInput = { Address: addressInput };

const { waitForResult } = await contract.functions.initialize(addressIdentityInput).call();

await waitForResult();

const { waitForResult: waitForResult2 } = await contract.functions.start_vault().call();

await waitForResult2();

console.log(`Liquidity contract deployed at ${contract.id}`);

// const {waitForResult: waitForResult3} = await contract.functions.deposit().callParams({forward: [10, assetId]}).call();

// const { value } = await waitForResult3();
