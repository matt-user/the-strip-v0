import { useWallet } from "@fuels/react";
import { useMutation } from "@tanstack/react-query";
import { useNotification } from "./useNotification";
import { Game } from "@/types";

import { gameContractAddress } from "../../../lib";
import { OutcomeInput } from "@/types/contracts/Game";
import { usdsAssetId } from "@/utils/assetId";

export const usePlaceBet = () => {
  const { wallet } = useWallet();
  const { errorNotification, successNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async ({ betOutcome, betAmount }: { betOutcome: OutcomeInput; betAmount: number }) => {
      if (!wallet) {
        throw new Error("Wallet must be connected to place bet.");
      }

      const game = new Game(gameContractAddress, wallet);

      const { maxFee, gasUsed } = await game.functions
        .place_bet(betOutcome)
        .callParams({ forward: [betAmount * 10 ** 9, usdsAssetId] })
        .getTransactionCost();

      const betTransactionRequest = await game.functions
        .place_bet(betOutcome)
        .callParams({ forward: [betAmount * 10 ** 9, usdsAssetId] })
        .getTransactionRequest();

      betTransactionRequest.gasLimit = gasUsed;
      betTransactionRequest.maxFee = maxFee;

      const placeBetResponse = await game.functions
        .place_bet(betOutcome)
        .callParams({ forward: [betAmount * 10 ** 9, usdsAssetId] })
        .call();

      const tx = await placeBetResponse.waitForResult();

      console.log("tx", tx);
    },
    onError: (error) => {
      console.error(error.message);
      errorNotification(error.message);
    },
    onSuccess: () => {
      successNotification("Successfully placed bet.");
    },
  });

  return mutation;
};
