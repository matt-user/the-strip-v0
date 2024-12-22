import { useEffect, useState } from "react";
import { useWallet } from "@fuels/react";
import Image from "next/image";
import useSound from "use-sound";

import {
  Game,
  IdentityOutput,
  OutcomeInput,
  OutcomeOutput,
} from "@/types/contracts/Game";
import Button from "./Button";
import { gameContractAddress } from "../../../lib";
import { Account, BN } from "fuels";
import { usePlaceBet } from "@/hooks/usePlaceBet";
import { useRequestRandom } from "@/hooks/useRequestRandom";
import { useProcessOutcomes } from "@/hooks/useProcessOutcomes";
import { useNumberOfBlocksBeforeMaturity } from "@/hooks/useNumberOfBlocksBeforeMaturity";
import horse0 from "../../public/horse0.jpeg";
import { useLastOutcome } from "@/hooks/useLastOutcome";
import { useGetBets } from "@/hooks/useGetBets";

type Bet = {
  user: string;
  outcome: OutcomeInput;
  amount: BN;
};

export default function GameContract() {
  const [betOutcome, setBetOutcome] = useState<OutcomeInput | null>(null);
  const [betAmount, setBetAmount] = useState<number>();
  const placeBet = usePlaceBet();
  const {
    data: numberOfBlocksBeforeMaturity,
    isFetching: isFetchingNumberOfBlocks,
    refetch: refetchNumberOfBlocksBeforeMaturity,
  } = useNumberOfBlocksBeforeMaturity();
  const { wallet } = useWallet();
  const {
    data: lastOutCome,
    isFetching: isFetchingLastOutcome,
    refetch: refetchLastOutcome,
  } = useLastOutcome();
  const {
    data: bets,
    isFetching: isFetchingBets,
    refetch: refetchBets,
  } = useGetBets();
  const [playHorseSound] = useSound("/horseSound.wav");

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isFetchingNumberOfBlocks) {
        refetchNumberOfBlocksBeforeMaturity();
      }
      if (!isFetchingLastOutcome) {
        refetchLastOutcome();
      }
      if (!isFetchingBets) {
        refetchBets();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [refetchNumberOfBlocksBeforeMaturity]);

  useEffect(() => {
    if (numberOfBlocksBeforeMaturity === 0) {
      playHorseSound();
    }
  }, [numberOfBlocksBeforeMaturity]);

  return (
    <>
      <div className="mx-56 mt-28 rounded-lg bg-gray-800">
        <div className="flex flex-col">
          <div className="flex flex-row">
            <div className="min-h-96 border-r border-gray-400 border-opacity-40">
              <div className="text-2xl mx-32 font-bold text-white mb-4">
                Current Bets
              </div>
              <div>
                {bets && bets.map(([user, outcome, amount]) => (
                  <div key={user.Address!.bits} className="flex justify-between mx-4 overflow-scroll">
                    <span className="flex-1">{`${user.Address!.bits.substring(0, 10)}...`}</span>
                    <span className="flex-1">{(amount.toNumber() / 10 ** 9).toFixed(3)}</span>
                    {outcome === OutcomeOutput.GREEN && (<span className="pr-2 text-green-700">●</span>)}
                    {outcome === OutcomeOutput.BLUE && (<span className="pr-2 text-blue-700">●</span>)}
                    {outcome === OutcomeOutput.RED && (<span className="pr-2 text-red-700">●</span>)}
                    {outcome === OutcomeOutput.YELLOW && (<span className="pr-2 text-yellow-400">●</span>)}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col ml-48 items-center justify-center">
            {lastOutCome !== undefined && numberOfBlocksBeforeMaturity !== undefined && numberOfBlocksBeforeMaturity !== 0 && (<div>Last Winner: {lastOutCome}</div>)}
              <div className="text-xl">
                {/*Do something if numberOfBlocksBeforeMaturity is null otherwise if it's 0 otherwise if its > 0 */}
                {numberOfBlocksBeforeMaturity !== undefined ? 
                  numberOfBlocksBeforeMaturity === 0 ? 
                  <div>
                    <Image src={horse0} width={200} height={200} alt="not found" />
                    <div>Resolution in progress...</div>
                  </div> : 
                  `${numberOfBlocksBeforeMaturity} seconds left to bet.` : 
                "Loading..."}
              </div>
            </div>
          </div>
          <div className="min-h-28 border-t border-gray-400 border-opacity-40">
            <div className="ml-28 flex flex-row text-8xl">
              <span className="flex-1 pr-2 text-green-700 hover:cursor-pointer" onClick={() => setBetOutcome(OutcomeInput.GREEN)}>{betOutcome === OutcomeInput.GREEN ? "●" : "￭"}</span>
              <span className="flex-1 pr-2 text-blue-700 hover:cursor-pointer" onClick={() => setBetOutcome(OutcomeInput.BLUE)}>{betOutcome === OutcomeInput.BLUE ? "●" : "￭"}</span>
              <span className="flex-1 pr-2 text-red-700 hover:cursor-pointer" onClick={() => setBetOutcome(OutcomeInput.RED)}>{betOutcome === OutcomeInput.RED ? "●" : "￭"}</span>
              <span className="flex-1 pr-2 text-yellow-400 hover:cursor-pointer" onClick={() => setBetOutcome(OutcomeInput.YELLOW)}>{betOutcome === OutcomeInput.YELLOW ? "●" : "￭"}</span>
            </div>
            <div className="mx-12 mb-4 flex flex-row justify-around">
              <input
                type="text"
                value={betAmount}
                onChange={(e) => {
                  setBetAmount(Number(e.target.value));
                }}
                placeholder="Enter amount"
                className="w-2/3 bg-black border border-white rounded-md px-2 py-1 mr-3 truncate font-mono"
                data-testid="liquidityToAdd"
              />
              <Button
                onClick={() => {
                  if (betAmount && betOutcome) {
                    placeBet.mutate({ betAmount, betOutcome });
                    setBetAmount(undefined);
                  }
                }}
                className="w-1/3"
                disabled={placeBet.isPending}
              >
                Place Bet
              </Button>
            </div>

          </div>
        </div>
      </div>
      <div></div>
    </>
  );
}
