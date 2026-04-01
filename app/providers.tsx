"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AptosWalletAdapterProvider
        autoConnect
        dappConfig={{
          network: Network.SHELBYNET,
        }}
      >
        {children}
      </AptosWalletAdapterProvider>
    </QueryClientProvider>
  );
}