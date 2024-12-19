import {
  ContractDeployOptions,
  createConfig,
  DeployedData,
  FuelsConfig,
  getMintedAssetId,
  bn,
} from "fuels";
import dotenv from "dotenv";
import { Provider, Wallet, defaultConsensusKey } from "fuels";

import { Game, LiquidityPool } from "./frontend/src/types";
import { providerUrl } from "./lib";
import { IdentityInput, Usds } from "./frontend/src/types/contracts/Usds";

dotenv.config({
  path: [".env.local", ".env"],
});

// If your node is running on a port other than 4000, you can set it here
const fuelCorePort = +(process.env.VITE_FUEL_NODE_PORT as string) || 4000;

export default createConfig({
  workspace: "../contracts", // Path to your Sway workspace
  output: "./frontend/src/types", // Where your generated types will be saved
  fuelCorePort,
  providerUrl,
  deployConfig: async (options: ContractDeployOptions) => {
    const { contracts, contractName } = options;

    const usdsContract = contracts.find((contract) => {
      return contract.name === "usds";
    });

    if (contractName === "liquidityPool") {
      if (!usdsContract) {
        throw new Error("USDS contract not deployed");
      }

      const depositAssetIdString = getMintedAssetId(
        usdsContract.contractId,
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );

      const depositAssetId = { bits: depositAssetIdString };

      return {
        configurableConstants: { DEPOSIT_ASSET_ID: depositAssetId },
      };
    }

    if (contractName === "game") {
      if (!usdsContract) {
        throw new Error("USDS contract not deployed");
      }

      const liquidityPoolContract = contracts.find((contract) => {
        return contract.name === "liquidityPool";
      });

      if (!liquidityPoolContract) {
        throw new Error("liquidity pool contract not deployed");
      }

      const depositAssetIdString = getMintedAssetId(
        usdsContract.contractId,
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
      const depositAssetId = { bits: depositAssetIdString };

      const liquidityPoolInput = { bits: liquidityPoolContract.contractId };

      return {
        configurableConstants: {
          BASE_ASSET: depositAssetId,
          LIQUIDITY_POOL: liquidityPoolInput,
        },
      };
    }

    return {};
  },
  onDeploy: async (_config: FuelsConfig, data: DeployedData) => {
    const contracts = data.contracts;

    const liquidityPoolContract = contracts?.find((contract) => {
      return contract.name === "liquidityPool";
    });

    const gameContract = contracts?.find((contract) => {
      return contract.name === "game";
    });

    const usdsContract = contracts?.find((contract) => {
      return contract.name === "usds";
    });

    if (!liquidityPoolContract || !gameContract || !usdsContract) {
      throw new Error("Contract not found");
    }

    const provider = await Provider.create(providerUrl);
    const privateKey = process.env.privateKey ?? defaultConsensusKey;
    const deployerWallet = Wallet.fromPrivateKey(privateKey, provider);

    const usds = new Usds(usdsContract.contractId, deployerWallet);
    const mintAmount = bn(1_000_000_000).mul(1_000_000);
    const mintResponse = await usds.functions
      .mint(
        {
          Address: { bits: deployerWallet.address.toString() },
        },
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        mintAmount
      )
      .call();
    await mintResponse.waitForResult();

    const liquidityPool = new LiquidityPool(
      liquidityPoolContract.contractId,
      deployerWallet
    );

    const initializeResponse = await liquidityPool.functions
      .initialize(
        {
          Address: { bits: deployerWallet.address.toString() },
        },
        { bits: gameContract.contractId }
      )
      .call();
    await initializeResponse.waitForResult();

    const depositAssetId = getMintedAssetId(
      usdsContract.contractId,
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
    const depositResponse = await liquidityPool.functions
      .deposit()
      .callParams({ forward: [mintAmount, depositAssetId] })
      .call();
    await depositResponse.waitForResult();

    const startVaultResponse = await liquidityPool.functions
      .start_vault()
      .call();
    await startVaultResponse.waitForResult();

    // TODO: implement prod deployment
    const newOwnerPublicKey = process.env.NEXT_PUBLIC_OWNER_ADDRESS;
    if (newOwnerPublicKey) {
      const newOwner: IdentityInput = { Address: { bits: newOwnerPublicKey } };
      const setNewOwnerResponse = await liquidityPool.functions
        .transfer_ownership(newOwner)
        .call();
      await setNewOwnerResponse.waitForResult();

      const game = new Game(gameContract.contractId, deployerWallet);
      const gameResponse = await game.functions.initialize(newOwner).call();
      await gameResponse.waitForResult();
    }
  },
});
