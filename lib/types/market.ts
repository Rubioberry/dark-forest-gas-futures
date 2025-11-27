/**
 * Market Types
 *
 * TypeScript interfaces for Myriad prediction markets.
 * These types match the Myriad REST API v2 response schemas.
 */

// =============================================================================
// Market Types
// =============================================================================

/**
 * Market state indicating the current phase of a prediction market.
 */
export type MarketState = "open" | "closed" | "resolved";

/**
 * An outcome represents one possible result of a prediction market.
 * For a binary market like "Will X happen?", there are typically two outcomes: Yes (0) and No (1).
 */
export interface Outcome {
  /** Unique identifier for this outcome (0, 1, 2, etc.) */
  id: number;
  /** Human-readable title (e.g., "Yes", "No", "Trump", "Biden") */
  title: string;
  /**
   * Current price between 0 and 1, representing probability.
   * A price of 0.65 means the market implies 65% chance of this outcome.
   */
  price: number;
  /** Total shares outstanding for this outcome */
  shares: number;
  /** Number of shares currently held (only in portfolio context) */
  sharesHeld?: number;
  /** Image URL for this outcome (optional) */
  imageUrl?: string | null;
  /** Price chart data for different timeframes */
  priceCharts?: OutcomePriceCharts;
}

/**
 * A single price data point from the API.
 */
export interface PriceDataPoint {
  /** Price value between 0 and 1 */
  value: number;
  /** Unix timestamp in seconds */
  timestamp: number;
  /** ISO date string */
  date: string;
}

/**
 * Price chart data for a specific timeframe.
 */
export interface PriceChartTimeframe {
  /** Timeframe identifier */
  timeframe: "24h" | "7d" | "30d" | "all";
  /** Array of price data points */
  prices: PriceDataPoint[];
  /** Percentage change over this timeframe */
  changePercent: number;
}

/**
 * Price charts array returned by the API.
 * Each outcome has an array of timeframe objects.
 */
export type OutcomePriceCharts = PriceChartTimeframe[];

/**
 * Fee configuration for a market.
 * Fees are taken from trades and distributed to treasury, liquidity providers, etc.
 */
export interface MarketFees {
  /** Fee going to Myriad treasury */
  treasury?: number;
  /** Fee going to the market creator/distributor (for revenue sharing) */
  distributor?: number;
  /** Total fee percentage */
  fee?: number;
}

/**
 * A prediction market on Myriad.
 * Markets are the core entity - users trade outcome shares to express predictions.
 */
export interface Market {
  /** On-chain market ID */
  id: number;
  /** Network ID where this market exists (2741 for Abstract mainnet) */
  networkId: number;
  /** URL-friendly unique identifier */
  slug: string;
  /** Market title/question (e.g., "Will ETH reach $5000 by end of 2025?") */
  title: string;
  /** Detailed description of the market */
  description: string;
  /** Current state of the market */
  state: MarketState;
  /** When the market closes for trading (ISO 8601 string) */
  expiresAt: string;
  /** When the market was published (ISO 8601 string) */
  publishedAt?: string;
  /** Whether the market was voided (cancelled) */
  voided: boolean;
  /** Outcome ID that won (only set if resolved) */
  resolvedOutcomeId?: number | null;
  /** Source used for resolution */
  resolutionSource?: string | null;
  /** Title of the resolution */
  resolutionTitle?: string | null;
  /** Image URL for the market */
  imageUrl?: string | null;
  /** ERC20 token address used for trading */
  tokenAddress: string;
  /** Topic categories for this market */
  topics: string[];
  /** Fee configuration */
  fees?: MarketFees;

  // Liquidity and volume metrics
  /** Total liquidity in the market (in token units) */
  liquidity: number;
  /** Price of liquidity shares */
  liquidityPrice?: number;
  /** All-time trading volume */
  volume: number;
  /** Trading volume in the last 24 hours */
  volume24h: number;
  /** Total shares across all outcomes */
  shares?: number;

  // Market type flags
  /** Whether this is an in-play market (live events) */
  inPlay?: boolean;
  /** When in-play trading starts */
  inPlayStartsAt?: string | null;
  /** Whether this is a perpetual market (no expiry) */
  perpetual?: boolean;
  /** Whether this is a moneyline market */
  moneyline?: boolean;

  /** The possible outcomes for this market */
  outcomes: Outcome[];
}

/**
 * A simplified market summary for list views.
 * Contains less data than the full Market type.
 */
export interface MarketSummary {
  id: number;
  networkId: number;
  slug: string;
  title: string;
  description: string;
  state: MarketState;
  expiresAt: string;
  imageUrl?: string | null;
  tokenAddress: string;
  topics: string[];
  liquidity: number;
  volume: number;
  volume24h: number;
  outcomes: Pick<Outcome, "id" | "title" | "price" | "shares">[];
}

// =============================================================================
// Market Events (Trade History)
// =============================================================================

/**
 * Types of actions that can occur on a market.
 */
export type MarketAction =
  | "buy"
  | "sell"
  | "add_liquidity"
  | "remove_liquidity"
  | "claim_winnings"
  | "claim_liquidity"
  | "claim_fees"
  | "claim_voided";

/**
 * A single event (trade or liquidity action) on a market.
 */
export interface MarketEvent {
  /** Wallet address of the user who performed the action */
  user: string;
  /** Type of action */
  action: MarketAction;
  /** Market title */
  marketTitle: string;
  /** Market slug */
  marketSlug: string;
  /** Market ID */
  marketId: number;
  /** Network ID */
  networkId: number;
  /** Title of the outcome (for buy/sell actions) */
  outcomeTitle?: string | null;
  /** Outcome ID (for buy/sell actions) */
  outcomeId?: number | null;
  /** Market image URL */
  imageUrl?: string | null;
  /** Number of shares involved */
  shares: number;
  /** Value in tokens */
  value: number;
  /** Unix timestamp in seconds */
  timestamp: number;
  /** Block number on chain */
  blockNumber: number;
  /** ERC20 token address */
  token: string;
}

