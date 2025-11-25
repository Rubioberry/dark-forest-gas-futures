/**
 * Wagmi Configuration
 *
 * This file configures wagmi for wallet connections on Abstract.
 * It includes both Abstract Global Wallet (AGW) and standard wallet connectors.
 *
 * AGW is Abstract's native smart contract wallet that provides:
 * - Social login (email, Google, etc.)
 * - Account abstraction features
 * - Cross-application wallet persistence
 *
 * @see https://docs.abs.xyz/abstract-global-wallet/agw-react/integrating-with-rainbowkit
 */

import { createConfig } from "wagmi";
import { abstract } from "wagmi/chains";
import { createClient, http } from "viem";
import { eip712WalletActions } from "viem/zksync";
import { connectorsForWallets, type WalletList } from "@rainbow-me/rainbowkit";
import { abstractWallet } from "@abstract-foundation/agw-react/connectors";
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  rainbowWallet,
} from "@rainbow-me/rainbowkit/wallets";

// =============================================================================
// Chain Configuration
// =============================================================================

/**
 * Chains supported by this application.
 */
export const chains = [abstract] as const;

// =============================================================================
// Wallet Connectors
// =============================================================================

/**
 * WalletConnect Project ID
 * Required for WalletConnect-based mobile connections.
 * Get one free at https://cloud.walletconnect.com
 *
 * Note: AGW works without a project ID. Other wallets (MetaMask, Rainbow, etc.)
 * require a valid project ID for full functionality.
 */
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

/**
 * Build wallet groups for RainbowKit.
 *
 * If no WalletConnect project ID is provided, only AGW is available.
 * This is because MetaMask, Rainbow, etc. use WalletConnect internally.
 *
 * CUSTOMIZE: To enable all wallets, set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
 */
function getWalletGroups(): WalletList {
  // AGW always works without a projectId
  const groups: WalletList = [
    {
      groupName: "Recommended",
      wallets: [abstractWallet],
    },
  ];

  // Only add WalletConnect-dependent wallets if projectId is provided
  if (projectId) {
    groups.push({
      groupName: "Other Wallets",
      wallets: [metaMaskWallet, coinbaseWallet, walletConnectWallet, rainbowWallet],
    });
  }

  return groups;
}

/**
 * Configure wallet connectors for RainbowKit.
 */
const connectors = connectorsForWallets(getWalletGroups(), {
  appName: "Myriad Starter Kit",
  projectId: projectId || "placeholder", // Placeholder for AGW-only mode
  appDescription: "Prediction markets on Abstract",
  appUrl: "https://myriadprotocol.com",
  appIcon: "",
});

// =============================================================================
// Wagmi Config
// =============================================================================

/**
 * Main wagmi configuration.
 *
 * Uses custom client setup with eip712WalletActions for Abstract's
 * native account abstraction support.
 */
export const wagmiConfig = createConfig({
  connectors,
  chains,
  client({ chain }) {
    return createClient({
      chain,
      transport: http(),
    }).extend(eip712WalletActions());
  },
  ssr: true,
});

// =============================================================================
// Type Exports
// =============================================================================

export type WagmiConfig = typeof wagmiConfig;
