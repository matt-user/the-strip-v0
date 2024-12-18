"use client";

import { useConnectUI, useIsConnected, useNetwork } from "@fuels/react";
import { useEffect } from "react";

import { useRouter } from "../hooks/useRouter";
import Button from "../components/Button";
import Info from "../components/Info";
import Wallet from "../components/Wallet";
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
    <main className="flex items-center justify-center lg:pt-6 text-zinc-50/90">
      <h1 className="fixed top-4 left-4 text-3xl font-medium">Strip</h1>
      <div id="container" className="mx-8 mb-32 w-full max-w-6xl">
        <div className="gradient-border rounded-2xl">
          <Info />
          <div className="col-span-5">
            <div className="gradient-border h-full rounded-xl bg-gradient-to-b from-blue-100 to-blue-500 fixed top-4 right-4">
              {!isConnected && (
                <section className="flex h-full flex-col justify-center space-y-6 px-4 py-8 lg:px-[25%]">
                  <Button onClick={() => connect()}>Connect Wallet</Button>
                </section>
              )}

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

              {isConnected && isConnectedToCorrectNetwork && (
                <section className="flex h-full flex-col justify-center space-y-6 px-4 py-8">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {views.map((viewName) => (
                      <Button
                        key={viewName}
                        className="w-full sm:flex-1 capitalize"
                        color={view === viewName ? "primary" : "inactive"}
                        onClick={() => setRoute(viewName)}
                      >
                        {viewName}
                      </Button>
                    ))}
                  </div>

                  {view === "Wallet" && <Wallet />}
                  {view === "Liquidity Pool" && <LiquidityPoolContract />}
                  {view === "Games" && <GameContract />}
                  {view === "Faucet" && <Faucet />}
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
