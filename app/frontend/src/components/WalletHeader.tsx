import {
  useDisconnect,
  useWallet,
  useBalance,
  useIsConnected,
  useConnectUI,
} from "@fuels/react";
import { useEffect } from "react";

import { usdsAssetId } from "../utils/assetId";

import { useMintUSDS } from "@/hooks/useMintUSDS";
import { BN } from "fuels";

export default function WalletHeader() {
  const { disconnect } = useDisconnect();
  const { wallet } = useWallet();
  const { isConnected, refetch: refetchIsConnected } = useIsConnected();
  const { connect, isConnecting } = useConnectUI();
  const address = wallet?.address.toB256() || "";
  const { balance, refetch: refetchBalance } = useBalance({
    address,
    assetId: usdsAssetId,
  });
  const mintUSDS = useMintUSDS();

  useEffect(() => {
    refetchBalance();
    refetchIsConnected();
  }, [refetchBalance, refetchIsConnected]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetchBalance();
      refetchIsConnected();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetchBalance, refetchIsConnected]);

  return (
    <>
      {isConnected ? (
        <div className="inline-flex items-center">
          <div>
            <div>
              {wallet
                ? `${wallet.address
                    .toString()
                    .substr(0, 10)}... | ${balance ? balance.format({ precision: 4 }) : new BN(0).format({ precision: 4 })} USDS`
                : "Loading..."}
            </div>
          </div>
          <div className="px-4 py-2 text-white hover:rounded-full hover:bg-gray-300 hover:bg-opacity-20">
            <button onClick={() => disconnect()}>Disconnect</button>
          </div>
          <div className="px-4 py-2 text-white hover:rounded-full hover:bg-gray-300 hover:bg-opacity-20">
            <button onClick={() => mintUSDS.mutate()}>Mint USDS</button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-2 text-white hover:rounded-full hover:bg-gray-300 hover:bg-opacity-20">
          <button onClick={() => connect()} disabled={isConnecting}>
            {isConnecting ? "Connecting..." : "Connect"}
          </button>
        </div>
      )}
    </>
  );
}
