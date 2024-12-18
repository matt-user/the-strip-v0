import { useEffect, useState } from "react";
import { useWallet } from "@fuels/react";

import LocalFaucet from "./LocalFaucet";
import { LiquidityPool } from "../../../scripts/types/contracts/LiquidityPool";
import Button from "./Button";
import { isLocal, localUSDSContractAddress } from "../../../lib";
import { useNotification } from "../hooks/useNotification";

export default function LiquidityPoolContract() {
  const { errorNotification } = useNotification();
  const [liquidityPool, setLiquidityPool] = useState<LiquidityPool>();
  const [liquidity] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);

  const { wallet, refetch } = useWallet();

  useEffect(() => {
    if (wallet) {
      const liquidityPool = new LiquidityPool(localUSDSContractAddress, wallet);
      setLiquidityPool(liquidityPool);
    }
  }, [wallet]);

  useEffect(() => {
    if (liquidityPool && !liquidity) {
      // Liquidity Pool Logic
    }
  }, [liquidityPool, liquidity]);

  async function addLiquidity() {
    if (!wallet || !liquidityPool) return;
    setIsLoading(true);

    try {
      // Liquidity Pool Logic
    } catch (error) {
      console.error(error);
      errorNotification("Error adding liquidity counter");
    }
    setIsLoading(false);
  }

  return (
    <>
      <div>
        <h3 className="mb-1 text-sm font-bold text-white">Current Liquidity</h3>
        <div className="flex items-center justify-between text-base">
          <input
            type="text"
            value={liquidity}
            className="w-2/3 bg-gray-800 rounded-md px-2 py-1 mr-3 truncate font-mono"
            disabled
            data-testid="liquidity"
          />
          <Button onClick={addLiquidity} className="w-1/3" disabled={isLoading}>
            Add Liquidity
          </Button>
        </div>
      </div>
      <div></div>
      {isLocal && <LocalFaucet refetch={refetch} />}
    </>
  );
}
