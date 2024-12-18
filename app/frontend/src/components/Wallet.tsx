import { useDisconnect, useWallet, useBalance } from "@fuels/react";
import { useEffect } from "react";

import Button from "./Button";
import LocalFaucet from "./LocalFaucet";
import { isLocal, renderFormattedBalance } from "../../../lib";
import { usdsAssetId } from "../utils/assetId";

export default function Wallet() {
  const { disconnect } = useDisconnect();
  const { wallet } = useWallet();
  const address = wallet?.address.toB256() || "";
  const { balance, refetch } = useBalance({ address, assetId: usdsAssetId });

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const interval = setInterval(() => refetch(), 5000);
    return () => clearInterval(interval);
  }, [refetch]);
  
  return (
    <>
      <div>
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
          <Button onClick={() => refetch()} className="w-1/3">
            Refresh
          </Button>
        </div>
      </div>
      {isLocal && <LocalFaucet refetch={refetch} />}
    </>
  );
}
