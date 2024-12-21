import * as dotenv from "dotenv";
import { getRandomB256, Provider, Wallet } from "fuels";
import { Game } from "./types/contracts/Game";

const GAME_CONTRACT_ID =
  "0x139ab6ac3a5742af033609d067801247a9a58c91c18effc2049dac3c95b5358d";
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
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const requestRandomResponse = await game.functions
      .request_random(getRandomB256())
      .callParams({ forward: [500, wallet.provider.getBaseAssetId()] })
      .call();

    await requestRandomResponse.waitForResult();
    console.log("Random number requested");
  } catch (e: unknown) {
    let i = 0;
    while (true) {
      if (i > 6) {
        console.log("Game resolution failed. Retry from scratch");
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const randomNumber = await game.functions.fulfill_random().call();
        await randomNumber.waitForResult();
        console.log("Game fully resolved");
      } catch (e) {
        console.log(e);
        console.log("Retry game resolution");
        i++;
        continue;
      }
      break;
    }
  }
}
