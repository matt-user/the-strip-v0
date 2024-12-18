import { BN } from "fuels";
import contractIds from "./scripts/contract-ids.json";

type environment_types = "local" | "testnet";

export const environments: {
  LOCAL: environment_types;
  TESTNET: environment_types;
} = { LOCAL: "local", TESTNET: "testnet" };
export const environment: environment_types = (process.env
  .NEXT_PUBLIC_DAPP_ENVIRONMENT ||
  environments.LOCAL) as unknown as environment_types;
export const isLocal = environment === environments.LOCAL;
export const isTestnet = environment === environments.TESTNET;

export const testnetProviderUrl = "https://testnet.fuel.network/v1/graphql";

export const providerUrl =
  environment === "local"
    ? "http://127.0.0.1:4000/v1/graphql"
    : testnetProviderUrl;
export const playgroundUrl = providerUrl.replace("v1/graphql", "v1/playground");

export const usdsContractAddress = contractIds.USDS_CONTRACT_ADDRESS;
export const liquidityPoolContractAddress =
  contractIds.LIQUIDITY_POOL_CONTRACT_ADDRESS;
export const gameContractAddress = contractIds.GAME_CONTRACT_ADDRESS;
export const testnetFaucetUrl = "https://faucet-testnet.fuel.network/";

export const renderTransactionId = (transactionId: string) => {
  if (isLocal) {
    return transactionId;
  }

  return (
    <a
      href={`https://app.fuel.network/tx/${transactionId}/simple`}
      target="_blank"
      rel="noreferrer"
      className="underline"
    >
      {transactionId}
    </a>
  );
};

export const renderFormattedBalance = (balance: BN) => {
  return balance.format({ precision: 4 });
};
