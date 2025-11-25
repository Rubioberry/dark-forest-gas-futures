"use client";

/**
 * Markets Page
 *
 * Main landing page displaying all available prediction markets.
 * Features:
 * - Search and filter markets
 * - Sort by volume, liquidity, etc.
 * - Paginated grid of market cards
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useNetwork } from "@/lib/network-context";
import { marketsInfiniteQueryOptions } from "@/lib/queries";
import { MarketFilters, type MarketFiltersValue } from "@/components/markets/market-filters";
import { MarketList } from "@/components/markets/market-list";

// =============================================================================
// Page Component
// =============================================================================

export default function MarketsPage() {
  const { apiBaseUrl, networkConfig } = useNetwork();

  // Filter state
  const [filters, setFilters] = useState<MarketFiltersValue>({
    sort: "volume_24h",
    state: "open",
  });

  // Infinite Query
  const {
    data,
    isPending,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    ...marketsInfiniteQueryOptions(apiBaseUrl, {
      limit: 12,
      networkId: networkConfig.id,
      keyword: filters.keyword,
      state: filters.state,
      sort: filters.sort,
      order: "desc",
    }),
  });

  // Intersection Observer for Infinite Scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: MarketFiltersValue) => {
    setFilters(newFilters);
    // React Query handles resetting automatically when query keys change (which happens when filters change)
  }, []);

  // Combine paginated results
  const markets = data?.pages.flatMap((page) => page.data) ?? [];
  const lastPage = data?.pages[data.pages.length - 1];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Prediction Markets</h1>
        <p className="mt-2 text-muted-foreground">
          Trade on the outcomes of real-world events on{" "}
          <span className="font-medium text-foreground">{networkConfig.name}</span>
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <MarketFilters value={filters} onChange={handleFiltersChange} />
      </div>

      {/* Market List */}
      <MarketList
        markets={markets}
        pagination={lastPage?.pagination}
        isLoading={isPending}
        onLoadMore={() => fetchNextPage()}
        isLoadingMore={isFetchingNextPage}
        loadMoreRef={loadMoreRef}
      />
    </div>
  );
}
