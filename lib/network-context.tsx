"use client";

/**
 * Network Context
 *
 * Provides network configuration throughout the app.
 * Currently configured for Abstract mainnet only.
 */

import { createContext, useContext, type ReactNode } from "react";
import { NETWORK, API_BASE_URL, CONTRACTS, TOKENS } from "./config";

// =============================================================================
// Context Types
// =============================================================================

interface NetworkContextValue {
  /** Network configuration */
  networkConfig: typeof NETWORK;
  /** API base URL */
  apiBaseUrl: string;
  /** Contract addresses */
  contracts: typeof CONTRACTS;
  /** Token configurations */
  tokens: typeof TOKENS;
}

// =============================================================================
// Context
// =============================================================================

const NetworkContext = createContext<NetworkContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface NetworkProviderProps {
  children: ReactNode;
}

/**
 * Provider component for network configuration.
 *
 * @example
 * ```tsx
 * <NetworkProvider>
 *   <App />
 * </NetworkProvider>
 * ```
 */
export function NetworkProvider({ children }: NetworkProviderProps) {
  const value: NetworkContextValue = {
    networkConfig: NETWORK,
    apiBaseUrl: API_BASE_URL,
    contracts: CONTRACTS,
    tokens: TOKENS,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access network context.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { networkConfig, apiBaseUrl } = useNetwork();
 *   return <div>Connected to {networkConfig.name}</div>;
 * }
 * ```
 */
export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}
