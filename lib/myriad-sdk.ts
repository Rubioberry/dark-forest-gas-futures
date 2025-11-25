/**
 * Myriad SDK Integration
 *
 * Wrapper around polkamarkets-js SDK for on-chain operations.
 * The SDK handles:
 * - ERC20 approvals
 * - Buying/selling outcome shares
 * - Claiming winnings and voided shares
 *
 * Note: This module is client-side only due to polkamarkets-js dependencies.
 * Always import dynamically or use in client components.
 */

import { CONTRACTS, NETWORK } from "./config";

// =============================================================================
// Types
// =============================================================================

// We use `any` here because polkamarkets-js types aren't exported properly
// and we need to handle dynamic imports
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Initialized SDK instance with prediction market contract.
 */
export interface MyriadSdk {
  /** The polkamarkets application instance */
  app: any;
  /** The prediction market contract instance */
  pm: any;
}

// =============================================================================
// SDK Initialization
// =============================================================================

/**
 * Dynamically import polkamarkets-js to avoid SSR issues.
 * The library has Node.js-only dependencies that break SSR.
 */
async function getPolkamarketsJs() {
  const polkamarketsjs = await import("polkamarkets-js");
  return polkamarketsjs;
}

/**
 * Initialize the Myriad SDK with a web3 provider.
 *
 * The SDK requires a web3 provider (e.g., from wagmi's connector) to:
 * - Sign transactions
 * - Read contract state
 * - Execute trades
 *
 * @param provider - Web3 provider from wallet connection
 * @returns Initialized SDK instance
 *
 * @example
 * ```ts
 * const provider = await connector.getProvider();
 * const sdk = await initializeSdk(provider);
 *
 * // Now use sdk.pm.buy(), sdk.pm.sell(), etc.
 * ```
 */
export async function initializeSdk(provider: unknown): Promise<MyriadSdk> {
  const polkamarketsjs = await getPolkamarketsJs();

  // Initialize the polkamarkets application
  const app = new polkamarketsjs.Application({
    web3Provider: provider,
    web3EventsProvider: NETWORK.rpcUrl,
  });

  // Get the prediction market contract instance
  const pm = app.getPredictionMarketV3PlusContract({
    contractAddress: CONTRACTS.predictionMarket,
    querierContractAddress: CONTRACTS.predictionMarketQuerier,
  });

  return { app, pm };
}

/**
 * Get an ERC20 contract instance for token operations.
 *
 * @param app - Polkamarkets application instance
 * @param tokenAddress - ERC20 token contract address
 * @returns ERC20 contract instance
 */
export function getErc20Contract(app: any, tokenAddress: string) {
  return app.getERC20Contract({
    contractAddress: tokenAddress,
  });
}

// =============================================================================
// Trade Operations
// =============================================================================

/**
 * Parameters for buying outcome shares.
 */
export interface BuyParams {
  /** Market ID */
  marketId: number;
  /** Outcome ID to buy */
  outcomeId: number;
  /** Amount of tokens to spend */
  value: number;
  /** Minimum shares to accept (slippage protection) */
  minOutcomeSharesToBuy: number;
  /** Whether to use wrapped native token */
  wrapped?: boolean;
}

/**
 * Parameters for selling outcome shares.
 */
export interface SellParams {
  /** Market ID */
  marketId: number;
  /** Outcome ID to sell */
  outcomeId: number;
  /** Amount of tokens to receive */
  value: number;
  /** Maximum shares to sell (slippage protection) */
  maxOutcomeSharesToSell: number;
  /** Whether to use wrapped native token */
  wrapped?: boolean;
}

/**
 * Execute a buy trade using the SDK.
 *
 * For revenue sharing, use `referralBuy` instead of regular `buy`.
 *
 * @param pm - Prediction market contract instance
 * @param params - Buy parameters
 * @param referralCode - Optional referral code for revenue sharing
 */
export async function executeBuy(
  pm: any,
  params: BuyParams,
  referralCode?: string
) {
  if (referralCode) {
    // Use referral buy for revenue sharing
    return pm.referralBuy({
      marketId: params.marketId,
      outcomeId: params.outcomeId,
      value: params.value,
      minOutcomeSharesToBuy: params.minOutcomeSharesToBuy,
      code: referralCode,
    });
  }

  // Regular buy without referral
  return pm.buy({
    marketId: params.marketId,
    outcomeId: params.outcomeId,
    value: params.value,
    minOutcomeSharesToBuy: params.minOutcomeSharesToBuy,
    wrapped: params.wrapped,
  });
}

/**
 * Execute a sell trade using the SDK.
 *
 * @param pm - Prediction market contract instance
 * @param params - Sell parameters
 * @param referralCode - Optional referral code
 */
export async function executeSell(
  pm: any,
  params: SellParams,
  referralCode?: string
) {
  if (referralCode) {
    return pm.referralSell({
      marketId: params.marketId,
      outcomeId: params.outcomeId,
      value: params.value,
      maxOutcomeSharesToSell: params.maxOutcomeSharesToSell,
      code: referralCode,
    });
  }

  return pm.sell({
    marketId: params.marketId,
    outcomeId: params.outcomeId,
    value: params.value,
    maxOutcomeSharesToSell: params.maxOutcomeSharesToSell,
    wrapped: params.wrapped,
  });
}

// =============================================================================
// Claim Operations
// =============================================================================

/**
 * Claim winnings from a resolved market.
 *
 * @param pm - Prediction market contract instance
 * @param marketId - Market ID
 * @param wrapped - Whether to unwrap to native token
 */
export async function claimWinnings(pm: any, marketId: number, wrapped?: boolean) {
  return pm.claimWinnings({
    marketId,
    wrapped,
  });
}

/**
 * Claim voided shares from a cancelled market.
 *
 * @param pm - Prediction market contract instance
 * @param marketId - Market ID
 * @param outcomeId - Outcome ID to claim
 * @param wrapped - Whether to unwrap to native token
 */
export async function claimVoided(
  pm: any,
  marketId: number,
  outcomeId: number,
  wrapped?: boolean
) {
  return pm.claimVoidedOutcomeShares({
    marketId,
    outcomeId,
    wrapped,
  });
}

// =============================================================================
// Approval Operations
// =============================================================================

/**
 * Check if token spending is approved for the prediction market contract.
 *
 * @param erc20 - ERC20 contract instance
 * @param userAddress - User's wallet address
 * @param amount - Amount to check approval for
 * @param spenderAddress - Prediction market contract address
 */
export async function checkApproval(
  erc20: any,
  userAddress: string,
  amount: string,
  spenderAddress: string
): Promise<boolean> {
  return erc20.isApproved({
    address: userAddress,
    amount,
    spenderAddress,
  });
}

/**
 * Approve token spending for the prediction market contract.
 *
 * @param erc20 - ERC20 contract instance
 * @param amount - Amount to approve (use large value for unlimited)
 * @param spenderAddress - Prediction market contract address
 */
export async function approveToken(
  erc20: any,
  amount: string,
  spenderAddress: string
) {
  return erc20.approve({
    amount,
    address: spenderAddress,
  });
}
