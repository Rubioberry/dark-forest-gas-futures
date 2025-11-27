/**
 * Myriad Starter Kit Configuration
 *
 * This file contains all network configurations, contract addresses, and API settings.
 * Myriad is deployed on Abstract (and other chains), but this starter kit focuses on Abstract.
 *
 * CUSTOMIZE: Update these values when deploying to production or adding new networks.
 */

// =============================================================================
// Network Configuration
// =============================================================================

export const NETWORK = {
  id: 2741,
  name: "Abstract",
  rpcUrl: "https://api.mainnet.abs.xyz",
  blockExplorer: "https://abscan.org",
} as const;

// =============================================================================
// Contract Addresses
// =============================================================================

/**
 * Myriad Protocol smart contract addresses on Abstract.
 * These contracts handle all prediction market logic on-chain.
 */
export const CONTRACTS = {
  /** Main prediction market contract - handles market creation, trading, resolution */
  predictionMarket: "0x3e0F5F8F5Fb043aBFA475C0308417Bf72c463289" as const,
  /** Read-only querier contract - batch fetches market data efficiently */
  predictionMarketQuerier: "0x1d5773Cd0dC74744C1F7a19afEeECfFE64f233Ff" as const,
} as const;

// =============================================================================
// Token Addresses
// =============================================================================

/**
 * ERC20 tokens supported for trading on Myriad.
 * Markets can be denominated in different tokens (USDC, PENGU, PTS).
 */
export const TOKENS = {
  /** USDC.e - Primary stablecoin for trading */
  USDC: {
    address: "0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1" as const,
    decimals: 6,
    symbol: "USDC.e",
  },
  /** PENGU - Pudgy Penguins token */
  PENGU: {
    address: "0x9eBe3A824Ca958e4b3Da772D2065518F009CBa62" as const,
    decimals: 18,
    symbol: "PENGU",
  },
  /** PTS - Myriad Points token */
  PTS: {
    address: "0x0b07cf011b6e2b7e0803b892d97f751659940f23" as const,
    decimals: 18,
    symbol: "PTS",
  },
} as const;

// =============================================================================
// API Configuration
// =============================================================================

/**
 * Myriad REST API endpoint.
 * The API provides market data, quotes, and portfolio information.
 *
 * Note: All endpoints (except health) require an API key.
 * Set NEXT_PUBLIC_MYRIAD_API_KEY in your .env file.
 */
export const API_BASE_URL = "https://api-v2.myriadprotocol.com";

/**
 * API key for Myriad REST API.
 * CUSTOMIZE: Set this in your .env.local file
 */
export const MYRIAD_API_KEY = process.env.NEXT_PUBLIC_MYRIAD_API_KEY ?? "";

// =============================================================================
// Referral Configuration
// =============================================================================

/**
 * Referral code for revenue sharing.
 * Builders using Myriad can receive a percentage of buy volume they generate.
 *
 * To get your own referral code:
 * 1. Contact the Myriad team to request whitelisting
 * 2. Provide your referral code string and claims wallet address
 * 3. Set NEXT_PUBLIC_REFERRAL_CODE in your .env file
 *
 * @see https://docs.myriadprotocol.com - Revenue Sharing for Builders
 */
export const REFERRAL_CODE = process.env.NEXT_PUBLIC_REFERRAL_CODE ?? "";

// =============================================================================
// Default Settings
// =============================================================================

/**
 * Default slippage tolerance for trades (0.5% = 0.005)
 */
export const DEFAULT_SLIPPAGE = 0.005;

/**
 * Items per page for paginated API responses
 */
export const DEFAULT_PAGE_SIZE = 20;

