import { useWallet } from "@fuels/react";
import { useQuery } from "@tanstack/react-query";

import { Game } from "@/types";
import { gameContractAddress } from "../../../lib";

export const useGetBets = () => {
  const { wallet } = useWallet();

  const query = useQuery({
    queryKey: ["getBets"],
    queryFn: async () => {
      if (!wallet) {
        throw new Error("Wallet not defined");
      }

      const game = new Game(gameContractAddress, wallet);
      const getBets = await game.functions
        .get_all_bets()
        .get();
      return getBets.value;
    },
    enabled: !!wallet,
  });

  return query;
};
