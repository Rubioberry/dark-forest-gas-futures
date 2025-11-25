"use client";

/**
 * App Providers
 *
 * This file wraps the application with all necessary providers:
 * - WagmiProvider: Wallet connection and blockchain interactions
 * - QueryClientProvider: TanStack Query for data fetching
 * - RainbowKitProvider: Wallet connection UI
 * - NetworkProvider: Network configuration
 *
 * The provider order matters - outer providers are available to inner ones.
 */

import { type ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/lib/wagmi";
import { NetworkProvider } from "@/lib/network-context";

// Import RainbowKit styles
import "@rainbow-me/rainbowkit/styles.css";

// =============================================================================
// Query Client Configuration
// =============================================================================

/**
 * Create a stable QueryClient instance.
 * We use useState to ensure the client persists across re-renders
 * but is unique per app instance (important for SSR).
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 30 seconds
        staleTime: 30 * 1000,
        // Keep unused data in cache for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry failed requests up to 2 times
        retry: 2,
        // Refetch when window regains focus
        refetchOnWindowFocus: true,
      },
      mutations: {
        // Don't retry failed mutations
        retry: false,
      },
    },
  });
}

// =============================================================================
// Providers Component
// =============================================================================

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Root providers component that wraps the entire application.
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <Providers>{children}</Providers>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function Providers({ children }: ProvidersProps) {
  // Create QueryClient once per app instance
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          // CUSTOMIZE: Change theme to match your app's design
          theme={{
            lightMode: lightTheme({
              accentColor: "#18181b", // zinc-900
              accentColorForeground: "white",
              borderRadius: "medium",
            }),
            darkMode: darkTheme({
              accentColor: "#fafafa", // zinc-50
              accentColorForeground: "#18181b",
              borderRadius: "medium",
            }),
          }}
          // Show recent transactions in the account modal
          showRecentTransactions={true}
        >
          <NetworkProvider>
            {children}
          </NetworkProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

