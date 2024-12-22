"use client";

import { Provider } from "fuels";
import { FuelProvider } from "@fuels/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defaultConnectors } from "@fuels/connectors";
import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";

import { providerUrl } from "../../../lib";

import "@/styles/globals.css";

const queryClient = new QueryClient();

const connectors = defaultConnectors({
  devMode: true,
  burnerWalletConfig: { fuelProvider: Provider.create(providerUrl) },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only render the component if the page has been mounted.
  if (!isMounted) return null;

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <title>Strip</title>
      </head>
      <body>
        <React.StrictMode>
          <QueryClientProvider client={queryClient}>
            <FuelProvider theme="dark" fuelConfig={{ connectors }}>
              <ToastContainer theme="dark" />
              <>{children}</>
            </FuelProvider>
          </QueryClientProvider>
        </React.StrictMode>
      </body>
    </html>
  );
}
