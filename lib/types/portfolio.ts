/**
 * Portfolio Types
 *
 * TypeScript interfaces for user portfolio and positions on Myriad.
 * A position represents a user's stake in a specific market outcome.
 */

// =============================================================================
// Position Types
// =============================================================================

/**
 * Status of a position indicating its current state.
 */
export type PositionStatus =
  | "ongoing" // Market still open, position active
  | "won" // Market resolved in user's favor
  | "lost" // Market resolved against user
  | "claimed" // Winnings have been claimed
  | "sold"; // Position was sold before resolution

/**
 * A user's position in a specific market outcome.
 * Represents shares held from buy/sell activity.
 */
export interface Position {
  /** On-chain market ID */
  marketId: number;
  /** Outcome ID within the market */
  outcomeId: number;
  /** Network ID (2741 for Abstract mainnet) */
  networkId: number;
  /** Market image URL */
  imageUrl?: string | null;

  // Market metadata (returned by API)
  /** Market title */
  marketTitle?: string;
  /** Market slug for linking */
  marketSlug?: string;
  /** Outcome title (e.g., "Yes", "No") */
  outcomeTitle?: string;
  /** Market state */
  marketState?: "open" | "closed" | "resolved";
  /** ERC20 token address */
  tokenAddress?: string;
  /** Market expiration date (ISO string) */
  expiresAt?: string;

  // Position metrics
  /** Net shares held (buys minus sells) */
  shares: number;
  /** Average buy price (cost basis) */
  price: number;
  /** Current value (shares * current price) */
  value: number;
  /** Original invested amount (value - profit) */
  invested?: number;
  /** Unrealized profit/loss */
  profit: number;
  /** Return on investment as decimal (null if not computable) */
  roi: number | null;

  // Claim status
  /** True if resolved with winning outcome and unclaimed */
  winningsToClaim: boolean;
  /** True if winnings have been claimed */
  winningsClaimed: boolean;
  /** Current status of the position */
  status: PositionStatus;
}

