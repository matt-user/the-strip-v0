import contractIds from "./frontend/src/types/contract-ids.json";

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

// TODO: Need to fix to use local also but when both are enabled it never detects testnet
export const providerUrl = testnetProviderUrl;
  // environment === "local"
  //   ? "http://127.0.0.1:4000/v1/graphql"
  //   : testnetProviderUrl;
export const playgroundUrl = providerUrl.replace("v1/graphql", "v1/playground");

export const usdsContractAddress = contractIds.usds;
export const liquidityPoolContractAddress = contractIds.liquidityPool;
export const gameContractAddress = contractIds.game;
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

