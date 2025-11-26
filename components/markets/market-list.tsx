"use client";

/**
 * Market List Component
 *
 * Displays a grid of market cards with loading and empty states.
 * Handles pagination through "Load More" button.
 */

import { MarketCard } from "./market-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { MarketSummary, Pagination } from "@/lib/types";

// =============================================================================
// Loading Skeleton
// =============================================================================

function MarketCardSkeleton() {
  return (
    <Card className="h-full flex flex-col overflow-hidden border border-border/50 py-0 gap-0">
      {/* Cover Image Skeleton */}
      <Skeleton className="h-40 w-full rounded-none" />

      <div className="flex flex-1 flex-col px-4 pt-3 pb-2">
        {/* Title Skeleton */}
        <div className="mb-2 space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Outcome Section Skeleton */}
        <div className="flex-1 space-y-2 mt-2">
          {/* Mocking the probability bar headers */}
          <div className="flex justify-between">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-8" />
          </div>
          {/* Mocking the probability bar */}
          <Skeleton className="h-2.5 w-full rounded-full" />

          {/* Mocking the buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Skeleton className="h-9 rounded-xl" />
            <Skeleton className="h-9 rounded-xl" />
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </Card>
  );
}

export function MarketListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <MarketCardSkeleton key={i} />
      ))}
    </div>
  );
}

// =============================================================================
// Empty State
// =============================================================================

interface EmptyStateProps {
  title?: string;
  description?: string;
}

function EmptyState({
  title = "No markets found",
  description = "Try adjusting your filters or check back later.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4">
        <svg
          className="h-8 w-8 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// =============================================================================
// Market List Component
// =============================================================================

interface MarketListProps {
  markets: MarketSummary[];
  pagination?: Pagination;
  isLoading?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  loadMoreRef?: React.RefObject<HTMLDivElement | null>;
}

export function MarketList({
  markets,
  pagination,
  isLoading,
  onLoadMore,
  isLoadingMore,
  loadMoreRef,
}: MarketListProps) {
  if (isLoading) {
    return <MarketListSkeleton />;
  }

  if (markets.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Market Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {markets.map((market) => (
          <MarketCard key={`${market.networkId}-${market.id}`} market={market} />
        ))}
      </div>

      {/* Load More */}
      {pagination && pagination.hasNext && (
        <div ref={loadMoreRef} className="flex justify-center pt-8 pb-4 min-h-[60px]">
          {isLoadingMore ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <div className="h-4 w-full" />
          )}
        </div>
      )}

      {/* Results Count */}
      {pagination && (
        <p className="text-center text-sm text-muted-foreground">
          {/* Use the length of the displayed (filtered) markets array instead of pagination.total if possible, 
              but since filtering happens client-side, the total from API (pagination.total) includes hidden/expired items.
              The user is confused why it says "Showing 47 of 48" when they only see 47.
              If we have filtered items out, we should hide the total or adjust the logic. 
              For now, just showing "Showing X markets" is less confusing than mismatched numbers. 
          */}
          Showing {markets.length} market{markets.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

