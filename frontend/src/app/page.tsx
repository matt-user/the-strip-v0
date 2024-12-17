'use client';

import { hasSignMessageCustomCurve } from '@fuels/connectors';
import {
  useAccounts,
  useConnectUI,
  useCurrentConnector,
  useDisconnect,
  useIsConnected,
  useWallet,
} from '@fuels/react';
import { pages } from 'next/dist/build/templates/app-page';
import { useState } from 'react';

enum Pages {
  Home = 'Home',
  Liquidity = 'Liquidity',
  Games = 'Games',
}

export default function PageContent() {
  const [page, setPage] = useState(Pages.Home);
  const { connect, error, isError, isConnecting } = useConnectUI();
  const { disconnect } = useDisconnect();
  const { isConnected } = useIsConnected();
  const { accounts } = useAccounts();
  const { wallet } = useWallet();
  const { currentConnector } = useCurrentConnector();

  return (
    <div className="h-screen flex flex-col bg-gradient-to-t from-gray-800 to-blue-700">
      <header className="flex justify-between items-center p-4">
        <button className="text-3xl font-bold text-white" onClick={() => setPage(Pages.Home)}>Strip</button>
        <div className='flex space-x-32 text-white'>
          <button className='text-lg px-4 py-2 text-white hover:bg-white hover:text-blue-800 rounded-full' onClick={() => {setPage(Pages.Liquidity)}}>Liquidity Pool</button>
          <button className='text-lg px-4 py-2 text-white hover:bg-white hover:text-blue-800 rounded-full' onClick={() => {setPage(Pages.Games)}}>Games</button>
        </div>
        <div className="text-lg px-4 py-2 text-white hover:bg-white hover:text-blue-800 rounded-full">
          {isConnected ? (
            <button onClick={() => disconnect()}>
              {wallet ? `${wallet.address.toString().substr(0, 10)}...` : 'Disconnect'}
            </button>
          ) : (
            <button onClick={() => connect()} disabled={isConnecting}>
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      </header>
      <main className="flex-grow ">
      {isError && <p className="Error">{error?.message}</p>}
      {page === Pages.Home && (
  <div className="flex items-center justify-center h-full">
    <h1 className="text-5xl font-bold text-white">
      The first fully decentralised Casino
    </h1>
  </div>
)}
      {page === Pages.Liquidity && (<div>Liquidity</div>)}
      {page === Pages.Games && (<div>Games</div>)}
      </main>
    </div>
  );
}