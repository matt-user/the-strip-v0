import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useWallet } from "@fuels/react";

import { usdsContractAddress } from "../../../lib";
import { bn } from "fuels";
import { IdentityInput, Usds } from "@/types/contracts/Usds";

const MINT_AMOUNT = 100_000_000_000;

export const useMintUSDS = () => {
  const { wallet } = useWallet();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!wallet) {
        throw new Error("Wallet must be connected to mint USDS");
      }

      const usdsContract = new Usds(usdsContractAddress, wallet);
      const walletIdentity: IdentityInput = {
        Address: { bits: wallet.address.toString() },
      };

      const response = await usdsContract.functions
        .mint(
          walletIdentity,
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          bn(MINT_AMOUNT)
        )
        .call();
    
      await response.waitForResult();
    },
    onError: () => {
      toast.error("Error minting USDS");
    },
    onSuccess: () => {
      toast.success("Successfully minted USDS");
    },
  });

  return mutation;
};
