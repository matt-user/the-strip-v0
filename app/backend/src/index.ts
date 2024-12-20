import * as dotenv from "dotenv";
import { getRandomB256, Provider, Wallet } from "fuels";
import { Game } from "./types/contracts/Game";

const GAME_CONTRACT_ID =
  "0xec792fb20fe52ba8181ff5929e03fa97e1070ac70946332439bb46032859e14f";
dotenv.config();

const provider = await Provider.create(
  "https://testnet.fuel.network/v1/graphql"
);

const wallet = Wallet.fromPrivateKey(process.env.PRIVATE_KEY!, provider);
while (true) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const game = new Game(GAME_CONTRACT_ID, wallet);
  const res = await game.functions.is_mature().dryRun();
  if (!res.value) {
    console.log("Game is not mature yet");
    continue;
  }
  console.log("Game is mature");

  try {
    const requestRandomResponse = await game.functions
      .request_random(getRandomB256())
      .callParams({ forward: [300, wallet.provider.getBaseAssetId()] })
      .call();

    await requestRandomResponse.waitForResult();
    console.log("Random number requested");
  } catch (e: unknown) {
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      try {
        const randomNumber = await game.functions.fulfill_random().call();
        await randomNumber.waitForResult();
        console.log("Game fully resolved");
      } catch (e) {
        console.log("Retry game resolution");
        continue;
      }
      break;
    }
  }
}
