import * as dotenv from "dotenv";
import { getRandomB256, Provider, Wallet } from "fuels";
import { Game } from "./types/contracts/Game";

const GAME_CONTRACT_ID =
  "0xa27f39765e72e727eaad6ffbca8814b7ba00f47045cd6f42db6ad4e603f0e895";
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
    const { waitForResult } = await game.functions
      .request_random(getRandomB256())
      .callParams({ forward: [300, wallet.provider.getBaseAssetId()] })
      .call();
    await waitForResult();
    console.log("Random number requested");
  } catch (e: unknown) {}
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
