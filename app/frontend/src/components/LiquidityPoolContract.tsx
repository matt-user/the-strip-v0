import { useEffect, useState } from "react";
import { useWallet } from "@fuels/react";

import LocalFaucet from "./LocalFaucet";
import { LiquidityPool } from "@/types/contracts/LiquidityPool";
import Button from "./Button";
import { isLocal, liquidityPoolContractAddress } from "../../../lib";
import { Account } from "fuels";
import { useAddLiquidity } from "@/hooks/useAddLiquidity";

export default function LiquidityPoolContract() {
  const [totalDeposits, setTotalDeposits] = useState<number>(0);
  const [totalCollateral, setTotalCollateral] = useState<number>(0);
  const [liquidityToAdd, setLiquidityToAdd] = useState<number>();

  const addLiquidity = useAddLiquidity();

  const { wallet, refetch } = useWallet();

  useEffect(() => {
    const updateDeposits = async (wallet: Account) => {
      const liquidityPool = new LiquidityPool(
        liquidityPoolContractAddress,
        wallet
      );
      const res = await liquidityPool.functions.total_deposits().dryRun();
      setTotalDeposits(res.value.toNumber());
    };

    const updateCollateral = async (wallet: Account) => {
      const liquidityPool = new LiquidityPool(
        liquidityPoolContractAddress,
        wallet
      );
      const res = await liquidityPool.functions.available_collateral().dryRun();
      setTotalCollateral(res.value.toNumber());
    };
    
    if (wallet) {
      updateDeposits(wallet);
      updateCollateral(wallet);
    }
  }, [wallet]);

  return (
    <>
      <div>
        <h3 className="mb-1 text-sm font-bold text-white">
          Current Liquidity is {(totalDeposits / 10 ** 9).toFixed(3)} USDS
        </h3>
        <h3 className="mb-1 text-sm font-bold text-white">
          Current Collateral available is{" "}
          {(totalCollateral / 10 ** 9).toFixed(3)} USDS
        </h3>
        <div className="flex items-center justify-between text-base">
          <input
            type="text"
            value={liquidityToAdd}
            onChange={(e) => {
              setLiquidityToAdd(Number(e.target.value));
            }}
            className="w-2/3 bg-gray-800 rounded-md px-2 py-1 mr-3 truncate font-mono"
            data-testid="liquidityToAdd"
          />
          <Button
            onClick={() => {
              if (liquidityToAdd) {
                addLiquidity.mutate(liquidityToAdd);
              }
            }}
            className="w-1/3"
            disabled={addLiquidity.isPending || !liquidityToAdd}
          >
            Add Liquidity
          </Button>
        </div>
      </div>
      <div></div>
      {isLocal && <LocalFaucet refetch={refetch} />}
    </>
  );
}
