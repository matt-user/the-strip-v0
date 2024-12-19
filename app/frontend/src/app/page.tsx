"use client";

import { useConnectUI, useIsConnected, useNetwork } from "@fuels/react";
import { useEffect } from "react";

import { useRouter } from "../hooks/useRouter";
import Button from "../components/Button";
import Info from "../components/Info";
import WalletHeader from "../components/WalletHeader";
import LiquidityPoolContract from "../components/LiquidityPoolContract";
import Faucet from "../components/Faucet";
import { providerUrl } from "../../../lib";
import GameContract from "@/components/GameContract";

function App() {
  const { connect } = useConnectUI();
  const { isConnected, refetch } = useIsConnected();
  const { network } = useNetwork();
  const { view, views, setRoute } = useRouter();
  const isConnectedToCorrectNetwork = network?.url === providerUrl;

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <main className="h-screen flex flex-col bg-gradient-to-t from-gray-800 to-blue-700 text-zinc-50/90">
      <header className="flex justify-between items-center p-4">
        <button className="text-3xl font-bold text-white" onClick={() => setRoute("")}>Strip</button>
        <div className='flex space-x-32 text-white'>
          {views.map((viewName) => (
            <button
              key={viewName}
              className="text-lg px-4 py-2 text-white bg-transparent hover:rounded-full hover:bg-gray-300 hover:bg-opacity-20"
              onClick={() => setRoute(viewName)}
            >
              {viewName}
            </button>
          ))}
        </div>
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
            {view === "" && (<div>Home</div>)}
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
