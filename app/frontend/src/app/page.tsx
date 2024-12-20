"use client";

import { useIsConnected, useNetwork } from "@fuels/react";
import { useEffect } from "react";

import { useRouter } from "../hooks/useRouter";
import Info from "../components/Info";
import WalletHeader from "../components/WalletHeader";
import LiquidityPoolContract from "../components/LiquidityPoolContract";
import Faucet from "../components/Faucet";
import { providerUrl } from "../../../lib";
import GameContract from "@/components/GameContract";
import { Navbar } from "@/components/Navbar";

function App() {
  const { isConnected, refetch } = useIsConnected();
  const { network } = useNetwork();
  const isConnectedToCorrectNetwork = network?.url === providerUrl;
  const { views, view, setRoute } = useRouter();

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <main className="h-screen flex flex-col bg-gradient-to-t from-gray-800 to-blue-700 text-zinc-50/90">
      <header className="flex justify-between items-center p-4">
        <Navbar views={views} setRoute={setRoute} />
        <div className="text-lg">
          <WalletHeader />
        </div>
      </header>
            {view === "" && 
              <div className="flex items-center justify-center h-full">
                <h1 className="text-5xl font-bold text-white">
                  The first fully decentralised Casino
                </h1>
              </div>}
            {view === "Liquidity Pool" && <LiquidityPoolContract />}
            {view === "Games" && <GameContract />}
            {view === "Faucet" && <Faucet />}
            <div className="absolute bottom-0 mr-4 mb-4 pl-4 right-0 pr-2 py-1 rounded-md bg-gray-900 border-1 border-gray-700">
              <div className="flex justify-between">
              <span className="pr-2 text-green-700">●</span>
              <p className="text-m">
                Testnet
              </p>
              </div>
              </div>
    </main>
  );
}

export default App;
