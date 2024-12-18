import { Provider, Wallet, getMintedAssetId } from 'fuels';
import { LiquidityPoolFactory } from './types/liquidity_pool/LiquidityPoolFactory';
import { GameFactory } from './types/game/GameFactory';

import * as dotenv from 'dotenv'
dotenv.config()

const provider = await Provider.create(
    'https://testnet.fuel.network/v1/graphql'
  );

const wallet = Wallet.fromPrivateKey(process.env.PRIVATE_KEY!, provider);
const assetId = getMintedAssetId(process.env.USDS_CONTRACT_ADDRESS!, "0x0000000000000000000000000000000000000000000000000000000000000000");
const assetIdInput = { bits: assetId }
const configurable_consts_lp = {
  DEPOSIT_ASSET_ID: assetIdInput
}

const deployLp = await LiquidityPoolFactory.deploy(wallet, {configurableConstants: configurable_consts_lp});
const { contract: contractLp } = await deployLp.waitForResult();
console.log(`Liquidity contract deployed.`);

const liquidityPoolInput = { bits: contractLp.id.toB256() }
const configurable_consts_game = {
  BASE_ASSET: assetIdInput,
  LIQUIDITY_POOL: liquidityPoolInput
}

const deployGame = await GameFactory.deploy(wallet, {configurableConstants: configurable_consts_game});
const { contract: contractGame } = await deployGame.waitForResult();
console.log(`Game contract deployed.`);

const addressInput = { bits: wallet.address.toB256() };
const addressIdentityInput = { Address: addressInput };
const gameInput = { bits: contractGame.id.toB256() };

const { waitForResult: waitForResultInitializeLp } = await contractLp.functions.initialize(addressIdentityInput, gameInput).call();
await waitForResultInitializeLp();
console.log("Liquidity contract initialized");

const { waitForResult: waitForResultInitializeGame } = await contractGame.functions.initialize(addressIdentityInput).call();
await waitForResultInitializeGame();
console.log("Game contract initialized");

const { waitForResult: waitForResult2 } = await contractLp.functions.start_vault().call();
await waitForResult2();
console.log("Vault started");

console.log(`Game contract deployed at ${contractGame.id}`);
console.log(`Liquidity contract deployed at ${contractLp.id}`);