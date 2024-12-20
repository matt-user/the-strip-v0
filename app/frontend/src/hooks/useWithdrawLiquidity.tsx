import { useWallet } from "@fuels/react";
import { LiquidityPool } from "@/types";
import { liquidityPoolContractAddress } from "../../../lib";
import { useMutation } from "@tanstack/react-query";
import { useNotification } from "./useNotification";

export const useWithdrawals = () => {
  const { errorNotification, successNotification } = useNotification();

  const { wallet } = useWallet();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!wallet) {
        console.log("no wallet");
        return;
      }

      const liquidityPool = new LiquidityPool(liquidityPoolContractAddress, wallet);
      const { waitForResult } = await liquidityPool.functions.withdrawal().call();
      const txn = await waitForResult();
      console.log("signalled for withdrawal", txn);
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
