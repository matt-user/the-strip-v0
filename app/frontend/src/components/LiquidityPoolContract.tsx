import { useEffect, useState } from "react";
import { useWallet } from "@fuels/react";

import { LiquidityPool } from "@/types/contracts/LiquidityPool";
import { liquidityPoolContractAddress } from "../../../lib";
import { Account } from "fuels";
import { useAddLiquidity } from "@/hooks/useAddLiquidity";
import { useWithdrawLiquidity } from "../hooks/useWithdrawLiquidity";

export default function LiquidityPoolContract() {
  const [totalDeposits, setTotalDeposits] = useState<number>(0);
  const [totalCollateral, setTotalCollateral] = useState<number>(0);
  const [roundCollateral, setRoundCollateral] = useState<number>(0);
  const [liquidityToAdd, setLiquidityToAdd] = useState<number>();
  const [liquidityToWithdraw, setLiquidityToWithdraw] = useState<number>();
  const addLiquidity = useAddLiquidity();
  const withdrawLiquidity = useWithdrawLiquidity();

  const { wallet } = useWallet();

  useEffect(() => {
    const updateDeposits = async (wallet: Account) => {
      const liquidityPool = new LiquidityPool(liquidityPoolContractAddress, wallet);
      const res = await liquidityPool.functions.total_deposits().dryRun();
      setTotalDeposits(res.value.toNumber());
    };

    const updateCollateral = async (wallet: Account) => {
      const liquidityPool = new LiquidityPool(liquidityPoolContractAddress, wallet);
      const res = await liquidityPool.functions.available_collateral().dryRun();
      setTotalCollateral(res.value.toNumber());
    };

    const updateRoundCollateral = async (wallet: Account) => {
      const liquidityPool = new LiquidityPool(liquidityPoolContractAddress, wallet);
      const res = await liquidityPool.functions.round_collateral().dryRun();
      setRoundCollateral(res.value.toNumber());
    };

    if (wallet) {
      updateDeposits(wallet);
      updateCollateral(wallet);
      updateRoundCollateral(wallet);
    }
  }, [wallet]);

  return (
    <>
      <div>
        <div className="">
          <p className="ml-16 mb-8 mt-16 text-2xl font-bold text-white"> All pools</p>
          <table className="ml-16 bg-gray-800 rounded-lg py-8 mb-32 table-auto w-5/6">
            <thead>
              <tr>
                <th className="py-4 border-b border-gray-500 text-gray-200">Asset</th>
                <th className="py-4 border-b border-gray-500 text-gray-200">Total Collateral available</th>
                <th className="py-4 border-b border-gray-500 text-gray-200">% used in game</th>
                <th className="py-4 border-b border-gray-500 text-gray-200">Deposit for next round</th>
                <th className="py-4 border-b border-gray-500 text-gray-200"></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pl-8 py-8 mx-auto font-bold text-2xl">USDS</td>
                <td className="pl-32 py-8"> {(roundCollateral / 10 ** 9).toFixed(3)} USDS</td>
                <td className="pl-32 py-8">{(totalCollateral / roundCollateral).toFixed(2)} %</td>
                <td className="pl-32 py-8">{(totalDeposits / 10 ** 9).toFixed(3)} USDS</td>
                <td className="py-8 w-2/12">
                  <input
                    type="text"
                    value={liquidityToAdd}
                    onChange={(e) => {
                      setLiquidityToAdd(Number(e.target.value));
                    }}
                    className="w-3/12 bg-black rounded-md px-2 py-1 mr-3 truncate font-mono"
                    data-testid="liquidityToAdd"
                  />
                  <button
                    className="hover:rounded-full hover:bg-gray-300 hover:bg-opacity-20 px-4 py-2"
                    onClick={() => {
                      if (liquidityToAdd) {
                        addLiquidity.mutate(liquidityToAdd);
                      }
                    }}
                    disabled={addLiquidity.isPending || !liquidityToAdd}
                  >
                    Add Liquidity
                  </button>
                </td>
                {roundCollateral > 0 && (
                  <td>
                    <input
                      type="text"
                      value={liquidityToWithdraw}
                      onChange={(e) => {
                        setLiquidityToWithdraw(Number(e.target.value));
                      }}
                      className="w-3/12 bg-black rounded-md px-2 py-1 mr-3 truncate font-mono"
                      data-testid="liquidityToWithdraw"
                    />
                    <button onClick={() => withdrawLiquidity.mutate(liquidityToWithdraw)}>withdraw liquidity</button>
                  </td>
                )}
              </tr>
              <tr>
                <td className="pl-8 py-8 mx-auto font-bold text-2xl">More to come...</td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
