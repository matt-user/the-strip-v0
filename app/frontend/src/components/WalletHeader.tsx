import { useDisconnect, useWallet, useBalance, useIsConnected, useConnectUI } from "@fuels/react";
import { useEffect, useState } from "react";

import { isLocal, renderFormattedBalance } from "../../../lib";

import { usdsAssetId } from "../utils/assetId";

import Button from "./Button";
import LocalFaucet from "./LocalFaucet";
import { useMintUSDS } from "@/hooks/useMintUSDS";
import { BN } from "fuels";

export default function WalletHeader() {
  const { disconnect } = useDisconnect();
  const { wallet } = useWallet();
  const { isConnected } = useIsConnected();
  const { connect, error, isError, isConnecting } = useConnectUI();
  const address = wallet?.address.toB256() || "";
  const { balance, refetch } = useBalance({ address, assetId: usdsAssetId });
  const mintUSDS = useMintUSDS();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const interval = setInterval(() => refetch(), 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <>
        {isConnected ? (
              <div className="inline-flex items-center">
            <div>
              <div>
                {wallet ? `${wallet.address.toString().substr(0, 10)}... | ${renderFormattedBalance(balance ? balance : new BN(0))} USDS` : 'Loading...'}
              </div>
            </div>
            <div className="px-4 py-2 text-white hover:rounded-full hover:bg-gray-300 hover:bg-opacity-20">
              <button onClick={() => disconnect()}>
                Disconnect
              </button>
            </div>
            <div className="px-4 py-2 text-white hover:rounded-full hover:bg-gray-300 hover:bg-opacity-20">
              <button onClick={() => mintUSDS.mutate()}> 
                Mint USDS
              </button>
            </div>
            </div>
        ) : (
          <div className="px-4 py-2 text-white hover:rounded-full hover:bg-gray-300 hover:bg-opacity-20">
            <button onClick={() => connect()} disabled={isConnecting}>
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        )}
      {/* <div>
        <h3 className="mb-1 text-sm font-bold text-white">Address</h3>
        <div className="flex flex-col md:flex-row items-center justify-between text-base">
          <input
            type="text"
            value={address}
            className="w-2/3 bg-gray-800 rounded-md mb-2 md:mb-0 px-2 py-1 mr-3 truncate font-mono"
            disabled
          />
          <Button onClick={() => disconnect()} className="w-1/3">
            Disconnect
          </Button>
        </div>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-bold text-white">Balance</h3>
        <div className="flex items-center justify-between text-base">
          <input
            type="text"
            value={balance ? `${renderFormattedBalance(balance)} USDS` : ""}
            className="w-2/3 bg-gray-800 rounded-md px-2 py-1 mr-3 truncate font-mono"
            disabled
          />
          <Button onClick={() => mintUSDS.mutate()} className="w-1/3">
            Mint
          </Button>
          <Button onClick={() => refetch()} className="w-1/3">
            Refresh
          </Button>
        </div>
      </div>
      {isLocal && <LocalFaucet refetch={refetch} />} */}
    </>
  );
}
