import { BN } from "fuels";
import contractIds from "./scripts/contract-ids.json";

export const environments = { LOCAL: "local", TESTNET: "testnet" };
export const environment = process.env.NEXT_PUBLIC_DAPP_ENVIRONMENT || environments.LOCAL;
export const isLocal = environment === environments.LOCAL;
export const isTestnet = environment === environments.TESTNET;

export const localProviderUrl = `http://127.0.0.1:${process.env.NEXT_FUEL_NODE_PORT || 4000}/v1/graphql`;
export const testnetProviderUrl = "https://testnet.fuel.network/v1/graphql";
export const providerUrl = isLocal ? localProviderUrl : testnetProviderUrl;
export const playgroundUrl = providerUrl.replace("v1/graphql", "v1/playground");

export const localUSDSContractAddress = contractIds.USDS_CONTRACT_ADDRESS;
export const testnetUSDSContractAddress = process.env.VITE_TESTNET_CONTRACT_ID as string;
export const usdsContractAddress = isLocal ? localUSDSContractAddress : testnetUSDSContractAddress;

export const testnetFaucetUrl = "https://faucet-testnet.fuel.network/";

export const renderTransactionId = (transactionId: string) => {
  if (isLocal) {
    return transactionId;
  }

  return (
    <a href={`https://app.fuel.network/tx/${transactionId}/simple`} target="_blank" rel="noreferrer" className="underline">
      {transactionId}
    </a>
  );
};

export const renderFormattedBalance = (balance: BN) => {
  return balance.format({ precision: 4 });
};
