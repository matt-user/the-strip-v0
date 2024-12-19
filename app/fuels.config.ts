import {
  ContractDeployOptions,
  createConfig,
  DeployedData,
  FuelsConfig,
  getMintedAssetId,
} from "fuels";
import dotenv from "dotenv";
import { Provider, Wallet, defaultConsensusKey } from "fuels";

import { LiquidityPool } from "./frontend/src/types";
import { providerUrl } from "./lib";
import { IdentityInput } from "./frontend/src/types/contracts/Usds";

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

    if (contractName === "liquidityPool") {
      const usdsContract = contracts.find((contract) => {
        return contract.name === "usds";
      });

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

    if (!liquidityPoolContract || !gameContract) {
      throw new Error("Contract not found");
    }

    const provider = await Provider.create(providerUrl);
    const privateKey = process.env.privateKey ?? defaultConsensusKey;
    const deployerWallet = Wallet.fromPrivateKey(privateKey, provider);

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

    const startVaultResponse = await liquidityPool.functions
      .start_vault()
      .call();
    await startVaultResponse.waitForResult();

    // TODO: implement prod deployment
    const newOwnerPublicKey = process.env.publicKey;
    if (newOwnerPublicKey) {
      const newOwner: IdentityInput = { Address: { bits: newOwnerPublicKey } };
      const setNewOwnerResponse = await liquidityPool.functions
        .transfer_ownership(newOwner)
        .call();
      await setNewOwnerResponse.waitForResult();
    }
  },
});
