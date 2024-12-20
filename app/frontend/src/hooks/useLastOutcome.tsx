import { useWallet } from "@fuels/react";
import { useQuery } from "@tanstack/react-query";

import { Game } from "@/types";
import { gameContractAddress } from "../../../lib";

export const useLastOutcome = () => {
  const { wallet } = useWallet();

  const query = useQuery({
    queryKey: ["lastOutcome"],
    queryFn: async () => {
      if (!wallet) {
        throw new Error("Wallet not defined");
      }

      const game = new Game(gameContractAddress, wallet);
      const lastOutcome = await game.functions
        .last_outcome()
        .get();
      return lastOutcome.value;
    },
    enabled: !!wallet,
  });

  return query;
};
