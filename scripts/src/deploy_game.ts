import { Provider, Wallet, getMintedAssetId } from 'fuels';
import { GameFactory } from './types/game/GameFactory';

import * as dotenv from 'dotenv'
dotenv.config()

const provider = await Provider.create(
    'https://testnet.fuel.network/v1/graphql'
  );
const wallet = Wallet.fromPrivateKey(process.env.PRIVATE_KEY!, provider);
const assetId = getMintedAssetId(process.env.USDS_CONTRACT_ADDRESS!, "0x0000000000000000000000000000000000000000000000000000000000000000");
const assetIdInput = { bits: assetId }
const liquidityPoolInput = { bits: process.env.LIQUIDITY_POOL_CONTRACT_ADDRESS! }
const configurable_consts = {
  BASE_ASSET: assetIdInput,
  LIQUIDITY_POOL: liquidityPoolInput
}

const deploy = await GameFactory.deploy(wallet, {configurableConstants: configurable_consts});
const { contract } = await deploy.waitForResult();
const addressInput = { bits: wallet.address.toB256() };
const addressIdentityInput = { Address: addressInput };

const { waitForResult } = await contract.functions.initialize(addressIdentityInput).call();

const { value } = await waitForResult();

console.log(`Game contract deployed at ${contract.id}`);
