import { useWallet } from "@fuels/react";
import { useQuery } from "@tanstack/react-query"

import { Game } from "@/types";
import { gameContractAddress } from "../../../lib";

export const useNumberOfBlocksBeforeMaturity = () => {
    const { wallet } = useWallet();
    const query = useQuery({
        queryKey: ["blocksBeforeMaturity"],
        queryFn: async () => {
            if (!wallet) {
                throw new Error("Wallet not defined");
            }

            const game = new Game(gameContractAddress, wallet);
            const numberOfBlocksBeforeMaturity = await game.functions.nb_block_before_maturity().get();
            return numberOfBlocksBeforeMaturity.value;
        },
        enabled: !!wallet
    });

    return query;
}
