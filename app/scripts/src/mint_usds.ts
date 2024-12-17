import { Provider, Wallet, Asset } from 'fuels';
import { Usds } from './types/usds/Usds';

import * as dotenv from 'dotenv'
dotenv.config()

const provider = await Provider.create(
    'https://testnet.fuel.network/v1/graphql'
  );
const wallet = Wallet.fromPrivateKey(process.env.PRIVATE_KEY!, provider);
const contract = await new Usds(process.env.USDS_CONTRACT_ADDRESS!, wallet);
const addressInput = { bits: wallet.address.toB256() };
const addressIdentityInput = { Address: addressInput };
const { waitForResult } = await contract.functions.mint(addressIdentityInput, "0x0000000000000000000000000000000000000000000000000000000000000000", 1000000000000n).call();
const { value } = await waitForResult();
console.log(`Minted 1000 USDS to ${wallet.address.toHexString()}`);