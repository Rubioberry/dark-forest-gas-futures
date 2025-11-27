/**
 * Markets Query Options
 *
 * TanStack Query options factories for fetching market data.
 * Use these with useQuery() for automatic caching, refetching, and loading states.
 */

import { queryOptions, infiniteQueryOptions } from "@tanstack/react-query";
import { getMarkets, getMarket } from "@/lib/myriad-api";
import type { MarketsQueryParams } from "@/lib/types";

// =============================================================================
// Query Keys
// =============================================================================

/**
 * Query key factory for markets.
 * Structured keys enable granular cache invalidation.
 */
export const marketKeys = {
  /** Base key for all market queries */
  all: ["markets"] as const,
  /** Key for market lists with filters */
  lists: () => [...marketKeys.all, "list"] as const,
  /** Key for a specific list query */
  list: (baseUrl: string, params: MarketsQueryParams) => [...marketKeys.lists(), baseUrl, params] as const,
  /** Key for market details */
  details: () => [...marketKeys.all, "detail"] as const,
  /** Key for a specific market */
  detail: (baseUrl: string, slugOrId: string | number, networkId?: number) =>
    [...marketKeys.details(), baseUrl, slugOrId, networkId] as const,
};

// =============================================================================
// Query Options
// =============================================================================

/**
 * Query options for fetching an infinite list of markets.
 *
 * @param baseUrl - API base URL
 * @param params - Filter parameters
 */
export function marketsInfiniteQueryOptions(baseUrl: string, params: MarketsQueryParams = {}) {
  return infiniteQueryOptions({
    queryKey: marketKeys.list(baseUrl, { ...params, page: undefined }), // Exclude page from key for infinite query base
    queryFn: ({ pageParam }) => getMarkets(baseUrl, { ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined;
    },
    // Markets data is relatively stable, cache for 30 seconds
    staleTime: 30 * 1000,
    // Don't refetch when component remounts if data is fresh
    refetchOnMount: false,
    // Enabled only when we have a base URL
    enabled: Boolean(baseUrl),
  });
}

/**
 * Query options for fetching a single market with full details.
 *
 * @param baseUrl - API base URL
 * @param slugOrId - Market slug (string) or ID (number)
 * @param networkId - Required when using market ID
 */
export function marketQueryOptions(baseUrl: string, slugOrId: string | number, networkId?: number) {
  return queryOptions({
    queryKey: marketKeys.detail(baseUrl, slugOrId, networkId),
    queryFn: () => getMarket(baseUrl, slugOrId, networkId),
    // Market details include price charts, cache a bit longer
    staleTime: 60 * 1000,
    enabled: Boolean(baseUrl && slugOrId),
  });
}
