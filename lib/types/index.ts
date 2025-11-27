/**
 * Type Exports
 *
 * Central export file for all TypeScript types used in the Myriad Starter Kit.
 * Import from '@/lib/types' for convenient access to all types.
 */

// Market types
export type {
  Outcome,
  Market,
  MarketSummary,
} from "./market";

// Portfolio types
export type {
  PositionStatus,
  Position,
} from "./portfolio";

// Trade types
export type {
  TradeAction,
  ClaimAction,
  QuoteRequest,
  Quote,
  ClaimRequest,
  ClaimResponse,
  TransactionStatus,
} from "./trade";

// API types
export type {
  Pagination,
  MarketsQueryParams,
  MarketsResponse,
  MarketResponse,
  UserEventsQueryParams,
  UserEventsResponse,
  PortfolioQueryParams,
  PortfolioResponse,
  ApiError,
} from "./api";

