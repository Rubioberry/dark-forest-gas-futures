"use client";

/**
 * Portfolio Page
 *
 * Displays the connected user's positions across all markets.
 * Includes:
 * - Portfolio summary (total value, P&L)
 * - List of positions with claim functionality
 * - Connect wallet prompt when not connected
 */

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useNetwork } from "@/lib/network-context";
import { portfolioQueryOptions } from "@/lib/queries";
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { PositionCard } from "@/components/portfolio/position-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// =============================================================================
// Loading Skeleton
// =============================================================================

function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-2 h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Positions Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Connect Wallet Prompt
// =============================================================================

function ConnectWalletPrompt() {
  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="flex flex-col items-center p-8 text-center">
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
              d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold">Connect Your Wallet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect your wallet to view your portfolio and positions.
        </p>
        <div className="mt-6">
          <ConnectButton />
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyPortfolio() {
  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="flex flex-col items-center p-8 text-center">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold">No Positions Yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&apos;t have any positions. Start trading on prediction markets to build your
          portfolio.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Browse Markets</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Page Component
// =============================================================================

export default function PortfolioPage() {
  const { status, address } = useAccount();
  const isConnected = status === "connected";
  const { apiBaseUrl, networkConfig } = useNetwork();

  // Fetch portfolio data
  const { data, isPending, error } = useQuery({
    ...portfolioQueryOptions(apiBaseUrl, address ?? "", {
      networkId: networkConfig.id,
    }),
    enabled: Boolean(address),
  });

  // Not connected
  if (!isConnected) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="mt-2 text-muted-foreground">
            Track your positions and claim winnings.
          </p>
        </div>
        <ConnectWalletPrompt />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
        <p className="mt-2 text-muted-foreground">
          Your positions on{" "}
          <span className="font-medium text-foreground">{networkConfig.name}</span>
        </p>
      </div>

      {/* Loading State */}
      {isPending && <PortfolioSkeleton />}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Failed to load portfolio. Please try again.</p>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Content */}
      {data && (
        <>
          {data.data.length === 0 ? (
            <EmptyPortfolio />
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <PortfolioSummary positions={data.data} />

              {/* Positions List */}
              <div>
                <h2 className="mb-4 text-lg font-semibold">
                  Positions ({data.data.length})
                </h2>
                <div className="space-y-4">
                  {data.data.map((position) => (
                    <PositionCard
                      key={`${position.marketId}-${position.outcomeId}`}
                      position={position}
                    />
                  ))}
                </div>
              </div>

              {/* Pagination info */}
              {data.pagination && data.pagination.hasNext && (
                <p className="text-center text-sm text-muted-foreground">
                  Showing {data.data.length} of {data.pagination.total} positions
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

