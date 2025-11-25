/**
 * API Types
 *
 * TypeScript interfaces for Myriad REST API request/response shapes.
 * These types help ensure type safety when interacting with the API.
 */

import type { Market, MarketSummary, MarketEvent, OutcomeHolders } from "./market";
import type { Position } from "./portfolio";

// =============================================================================
// Pagination
// =============================================================================

/**
 * Pagination metadata returned by list endpoints.
 */
export interface Pagination {
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  limit: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there's a next page */
  hasNext: boolean;
  /** Whether there's a previous page */
  hasPrev: boolean;
}

/**
 * Wrapper for paginated API responses.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// =============================================================================
// Markets API
// =============================================================================

/**
 * Query parameters for listing markets.
 */
export interface MarketsQueryParams {
  /** Page number (default: 1) */
  page?: number;
  /** Items per page (default: 20, max: 100) */
  limit?: number;
  /** Sort field */
  sort?: "volume" | "volume_24h" | "liquidity" | "expires_at" | "published_at";
  /** Sort order */
  order?: "asc" | "desc";
  /** Filter by network ID */
  networkId?: number;
  /** Filter by market state */
  state?: "open" | "closed" | "resolved";
  /** Filter by token address */
  tokenAddress?: string;
  /** Filter by topics (comma-separated) */
  topics?: string;
  /** Search keyword (searches title, description, outcome titles) */
  keyword?: string;
}

/**
 * Response from GET /markets endpoint.
 */
export interface MarketsResponse extends PaginatedResponse<MarketSummary> {}

/**
 * Response from GET /markets/:id endpoint.
 * Returns full market details with price charts.
 * Note: The API returns the market directly without a data wrapper.
 */
export type MarketResponse = Market;

// =============================================================================
// Market Events API
// =============================================================================

/**
 * Query parameters for market events.
 */
export interface MarketEventsQueryParams {
  /** Page number */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Filter events since this timestamp (unix seconds) */
  since?: number;
  /** Filter events until this timestamp (unix seconds) */
  until?: number;
}

/**
 * Response from GET /markets/:id/events endpoint.
 */
export interface MarketEventsResponse extends PaginatedResponse<MarketEvent> {}

// =============================================================================
// Market Holders API
// =============================================================================

/**
 * Query parameters for market holders.
 */
export interface MarketHoldersQueryParams {
  /** Page number */
  page?: number;
  /** Items per page (applies per outcome) */
  limit?: number;
}

/**
 * Response from GET /markets/:id/holders endpoint.
 */
export interface MarketHoldersResponse extends PaginatedResponse<OutcomeHolders> {}

// =============================================================================
// User API
// =============================================================================

/**
 * Query parameters for user events.
 */
export interface UserEventsQueryParams {
  /** Page number */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Filter by market ID */
  marketId?: number;
  /** Filter by network ID */
  networkId?: number;
  /** Filter events since this timestamp */
  since?: number;
  /** Filter events until this timestamp */
  until?: number;
}

/**
 * Response from GET /users/:address/events endpoint.
 */
export interface UserEventsResponse extends PaginatedResponse<MarketEvent> {}

/**
 * Query parameters for user portfolio.
 */
export interface PortfolioQueryParams {
  /** Page number */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Filter by market slug */
  marketSlug?: string;
  /** Filter by market ID */
  marketId?: number;
  /** Filter by network ID */
  networkId?: number;
  /** Filter by token address */
  tokenAddress?: string;
}

/**
 * Response from GET /users/:address/portfolio endpoint.
 */
export interface PortfolioResponse extends PaginatedResponse<Position> {}

// =============================================================================
// Questions API
// =============================================================================

/**
 * A question is a canonical proposition that can have markets on multiple chains.
 */
export interface Question {
  /** Question ID */
  id: number;
  /** Question title */
  title: string;
  /** Expiration timestamp */
  expiresAt: string;
  /** Number of markets for this question */
  marketCount: number;
  /** Markets for this question across chains */
  markets: MarketSummary[];
}

/**
 * Query parameters for listing questions.
 */
export interface QuestionsQueryParams {
  /** Page number */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Search keyword */
  keyword?: string;
  /** Minimum number of linked markets */
  minMarkets?: number;
  /** Maximum number of linked markets */
  maxMarkets?: number;
}

/**
 * Response from GET /questions endpoint.
 */
export interface QuestionsResponse extends PaginatedResponse<Question> {}

// =============================================================================
// Error Response
// =============================================================================

/**
 * Error response from the API.
 */
export interface ApiError {
  /** HTTP status code */
  statusCode: number;
  /** Error message */
  message: string;
  /** Error code/type */
  error?: string;
}

