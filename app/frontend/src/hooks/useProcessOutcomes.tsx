import { useWallet } from "@fuels/react";
import { useMutation } from "@tanstack/react-query";

import { useNotification } from "./useNotification";
import { Game } from "@/types";
import { gameContractAddress } from "../../../lib";

export const useProcessOutcomes = () => {
  const { wallet } = useWallet();
  const { errorNotification, successNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!wallet) {
        throw new Error("Wallet not found.");
      }

      const game = new Game(gameContractAddress, wallet);
      const processOutcomesResponse = await game.functions
        .fulfill_random()
        .call();
      await processOutcomesResponse.waitForResult();
    },
    onError: (error) => {
      console.error(error.message);
      errorNotification(error.message);
    },
    onSuccess: () => {
      successNotification("Successfully processed outcomes.");
    },
  });

  return mutation;
};
