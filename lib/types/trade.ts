/**
 * Trade Types
 *
 * TypeScript interfaces for trading operations on Myriad.
 * Includes quote requests/responses and transaction types.
 */

// =============================================================================
// Trade Actions
// =============================================================================

/**
 * Trade action type - buying or selling outcome shares.
 */
export type TradeAction = "buy" | "sell";

/**
 * Claim action type - claiming winnings or voided shares.
 */
export type ClaimAction = "claim_winnings" | "claim_voided";

// =============================================================================
// Quote Types
// =============================================================================

/**
 * Request parameters for getting a trade quote.
 * The API will calculate expected shares, fees, and provide calldata.
 */
export interface QuoteRequest {
  /** On-chain market ID (required with networkId) */
  marketId?: number;
  /** Network ID (required with marketId) */
  networkId?: number;
  /** Market slug (alternative to marketId + networkId) */
  marketSlug?: string;
  /** Outcome ID to trade */
  outcomeId: number;
  /** Trade action */
  action: TradeAction;
  /**
   * Amount of tokens to spend (buy) or receive (sell).
   * For buy: this is the token amount to spend.
   * For sell: this is the token amount to receive.
   */
  value?: number;
  /**
   * Number of shares to buy or sell.
   * For buy: must be omitted (use value instead).
   * For sell: alternative to value - specify shares to sell.
   */
  shares?: number;
  /**
   * Slippage tolerance (0-1).
   * Default is 0.005 (0.5%).
   * @example 0.01 for 1% slippage
   */
  slippage?: number;
}

/**
 * Quote response from the Myriad API.
 * Contains the expected trade outcome and transaction calldata.
 */
export interface Quote {
  /** Input value used for calculation */
  value: number;
  /** Expected shares to receive (buy) or sell */
  shares: number;
  /**
   * Slippage-adjusted threshold.
   * For buy: minimum shares to accept.
   * For sell: maximum shares to give up.
   */
  sharesThreshold: number;
  /** Average execution price */
  priceAverage: number;
  /** Price before the trade */
  priceBefore: number;
  /** Price after the trade (estimated) */
  priceAfter: number;
  /** Hex-encoded calldata to send to the contract */
  calldata: string;
  /** Net amount after fees */
  netAmount: number;
  /** Fee breakdown */
  fees: QuoteFees;
}

/**
 * Fee breakdown in a quote.
 */
export interface QuoteFees {
  /** Fee going to Myriad treasury */
  treasury: number;
  /** Fee going to distributor (revenue sharing) */
  distributor: number;
  /** Total fee amount */
  fee: number;
}

// =============================================================================
// Claim Types
// =============================================================================

/**
 * Request parameters for getting claim calldata.
 */
export interface ClaimRequest {
  /** On-chain market ID (required with networkId) */
  marketId?: number;
  /** Network ID (required with marketId) */
  networkId?: number;
  /** Market slug (alternative to marketId + networkId) */
  marketSlug?: string;
  /** Outcome ID (only required for voided markets) */
  outcomeId?: number;
}

/**
 * Claim response from the Myriad API.
 */
export interface ClaimResponse {
  /** Type of claim action */
  action: ClaimAction;
  /** Outcome ID being claimed */
  outcomeId: number;
  /** Hex-encoded calldata to send to the contract */
  calldata: string;
}

// =============================================================================
// Transaction Types
// =============================================================================

/**
 * Transaction status for tracking trade execution.
 */
export type TransactionStatus =
  | "idle"
  | "pending_approval"
  | "approving"
  | "pending_signature"
  | "confirming"
  | "confirmed"
  | "failed";

