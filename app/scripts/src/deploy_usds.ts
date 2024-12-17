import { Provider, Wallet } from 'fuels';
import { UsdsFactory } from './types/usds/UsdsFactory';

import * as dotenv from 'dotenv'
dotenv.config()

const provider = await Provider.create(
    'https://testnet.fuel.network/v1/graphql'
  );
const wallet = Wallet.fromPrivateKey(process.env.PRIVATE_KEY!, provider);
const deploy = await UsdsFactory.deploy(wallet);
const { contract } = await deploy.waitForResult();
const addressInput = { bits: wallet.address.toB256() };
const addressIdentityInput = { Address: addressInput };

const { waitForResult } = await contract.functions.constructor(addressIdentityInput).call();

const { value } = await waitForResult();

console.log(`USDS contract deployed at ${contract.id}`);
