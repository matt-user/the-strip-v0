import { useWallet } from "@fuels/react";
import { LiquidityPool } from "@/types";
import { liquidityPoolContractAddress } from "../../../lib";
import { useMutation } from "@tanstack/react-query";
import { useNotification } from "./useNotification";

export const useWithdrawLiquidity = () => {
  const { errorNotification, successNotification } = useNotification();

  const { wallet } = useWallet();

  const mutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!wallet) {
        console.log("no wallet");
        return;
      }

      if (amount <= 0) {
        throw new Error("Withdrawal amount must be greater than 10% of collateral");
      }

      const liquidityPool = new LiquidityPool(liquidityPoolContractAddress, wallet);
      const { waitForResult } = await liquidityPool.functions.signal_withdrawal(amount).call();
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
