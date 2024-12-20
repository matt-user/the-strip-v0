import * as dotenv from 'dotenv'
import { Provider, Wallet } from 'fuels';
import { Game } from '../../frontend/src/types/contracts/Game'
const GAME_CONTRACT_ID = "0x639ba1cd8af7a5c028f7c4f826cbe9c91cb2feb14f46d674676eee3232bd2917";
dotenv.config()

const provider = await Provider.create(
    'https://testnet.fuel.network/v1/graphql'
  );

const wallet = Wallet.fromPrivateKey(process.env.PRIVATE_KEY!, provider);
while (true) {
    
}