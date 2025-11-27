/**
 * Query Options Exports
 *
 * Central export for all TanStack Query options factories.
 * Import from '@/lib/queries' for convenient access.
 */

// Markets
export { 
  marketKeys, 
  marketsInfiniteQueryOptions,
  marketQueryOptions,
} from "./markets";

// Portfolio
export { portfolioKeys, portfolioQueryOptions, userEventsInfiniteQueryOptions } from "./portfolio";

// Profile
export { profileKeys, abstractProfileQueryOptions } from "./profile";
