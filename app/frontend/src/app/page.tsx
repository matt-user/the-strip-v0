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
      <div id="container" className="mx-8 mb-32 w-full max-w-6xl">
        <div className="gradient-border rounded-2xl">
          <Info />
          <div className="col-span-5">
            {isConnected && !isConnectedToCorrectNetwork && (
              <section className="flex h-full flex-col justify-center space-y-6 px-4 py-8">
                <p className="text-center">
                  You are connected to the wrong network. Please switch to{" "}
                  <a
                    href={providerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-500/80 transition-colors hover:text-green-500"
                  >
                    {providerUrl}
                  </a>
                  &nbsp;in your wallet.
                </p>
              </section>
            )}
            {view === "" && <div>Home</div>}
            {view === "Liquidity Pool" && <LiquidityPoolContract />}
            {view === "Games" && <GameContract />}
            {view === "Faucet" && <Faucet />}
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
