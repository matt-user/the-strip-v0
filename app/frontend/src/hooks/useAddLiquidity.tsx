import { useWallet } from "@fuels/react";
import { useMutation } from "@tanstack/react-query";

import { usdsAssetId } from "@/utils/assetId";
import { useNotification } from "./useNotification";
import { LiquidityPool } from "@/types";
import { liquidityPoolContractAddress } from "../../../lib";

export const useAddLiquidity = () => {
  const { errorNotification, successNotification } = useNotification();
  const { wallet } = useWallet();

  const mutation = useMutation({
    mutationFn: async (liquidityToAdd: number) => {
      if (!wallet) {
        throw new Error("Wallet must be connected to add liquidity");
      }

      const liquidityPool = new LiquidityPool(
        liquidityPoolContractAddress,
        wallet
      );
      // TODO: make liquidityToAdd a BN
      const response = await liquidityPool.functions
        .deposit()
        .callParams({ forward: [liquidityToAdd * 10 ** 9, usdsAssetId] })
        .call();

      const result = await response.waitForResult();
      console.log(`result`, result);
    },
    onError: (error) => {
      console.error(error.message);
      errorNotification(error.message);
    },
    onSuccess: () => {
      successNotification("Successfully added liquidity.");
    },
  });

  return mutation;
};
