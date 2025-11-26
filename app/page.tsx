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

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useNetwork } from "@/lib/network-context";
import { marketsInfiniteQueryOptions } from "@/lib/queries";
import { MarketFilters, type MarketFiltersValue } from "@/components/markets/market-filters";
import { MarketList } from "@/components/markets/market-list";

// =============================================================================
// Page Component
// =============================================================================

function MarketsPageContent() {
  const { apiBaseUrl, networkConfig, tokens } = useNetwork();
  const searchParams = useSearchParams();
  const urlKeyword = searchParams.get("q") || undefined;

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
      networkId: 2741, // Hardcoded to Abstract Mainnet as requested
      tokenAddress: tokens.USDC.address, // Only show USDC markets
      keyword: urlKeyword, // Use keyword from URL
      state: "open", // Force only open/active markets as requested
      sort: filters.sort,
      // Fix: categories need to be capitalized for the API to work
      topics: filters.topics && filters.topics !== "all" 
        ? filters.topics.charAt(0).toUpperCase() + filters.topics.slice(1) 
        : undefined,
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
  }, []);

  // Combine paginated results
  const rawMarkets = data?.pages.flatMap((page) => page.data) ?? [];
  const markets = rawMarkets.filter(market => {
    if (!market.expiresAt) return true;
    return new Date(market.expiresAt).getTime() > Date.now();
  });

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

export default function MarketsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8 h-screen" />}>
      <MarketsPageContent />
    </Suspense>
  );
}
