import { useWallet } from "@fuels/react";
import { useMutation } from "@tanstack/react-query";
import { getRandomB256 } from "fuels";
import { useNotification } from "./useNotification";
import { Game } from "@/types";
import { gameContractAddress } from "../../../lib";

export const useRequestRandom = () => {
  const { wallet } = useWallet();
  const { errorNotification, successNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!wallet) {
        throw new Error("Wallet not found.");
      }

      const game = new Game(gameContractAddress, wallet);
      const requestRandomResponse = await game.functions
        .request_random(getRandomB256())
        .callParams({ forward: [10_000, wallet.provider.getBaseAssetId()] })
        .call();
      await requestRandomResponse.waitForResult();
    },
    onError: (error) => {
      console.error(error.message);
      errorNotification(error.message);
    },
    onSuccess: () => {
      successNotification("Successfully requested random number.");
    },
  });

  return mutation;
};
