"use client";

/**
 * Activity Feed Component
 *
 * Displays a chronological list of user activities (trades, claims, etc) in a sortable table format.
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useNetwork } from "@/lib/network-context";
import { userEventsInfiniteQueryOptions } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, ShoppingCart, Banknote, RefreshCw, ExternalLink, BarChart3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// =============================================================================
// Helper Functions
// =============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getActionBadge(action: string) {
  const lowerAction = action.toLowerCase();
  let className = "bg-muted text-muted-foreground border-border";
  let icon = <RefreshCw className="mr-1 h-3 w-3" />;

  if (lowerAction === "buy") {
    className = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    icon = <ShoppingCart className="mr-1 h-3 w-3" />;
  } else if (lowerAction === "sell") {
    className = "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20";
    icon = <Banknote className="mr-1 h-3 w-3" />;
  }

  return (
    <Badge variant="outline" className={cn("font-medium capitalize pl-1.5", className)}>
      {icon}
      {action}
    </Badge>
  );
}

// =============================================================================
// Component
// =============================================================================

interface ActivityFeedProps {
  className?: string;
}

export function ActivityFeed({ className }: ActivityFeedProps = {}) {
  const { address } = useAccount();
  const { apiBaseUrl, networkConfig } = useNetwork();

  const {
    data,
    isPending,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...userEventsInfiniteQueryOptions(apiBaseUrl, address ?? "", {
      networkId: networkConfig.id,
    }),
    enabled: !!address,
  });

  const events = data?.pages.flatMap((page) => page.data) ?? [];

  if (isPending) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={cn("p-12 text-center border rounded-lg border-dashed text-muted-foreground", className)}>
        No activity found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={cn("rounded-md border border-border/50 overflow-hidden", className)}>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-[300px]">Market</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event, idx) => (
              <TableRow key={`${event.marketId}-${event.timestamp}-${idx}`} className="group border-border/50 hover:bg-muted/30">
                {/* Market Info */}
                <TableCell className="align-middle py-4">
                  <Link href={`/markets/${event.marketSlug}`} className="flex gap-3 group/market">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      {event.imageUrl ? (
                        <Image
                          src={event.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="font-medium text-sm truncate group-hover/market:text-primary transition-colors max-w-[240px] block">
                        {event.marketTitle || `Market #${event.marketId}`}
                      </span>
                    </div>
                  </Link>
                </TableCell>

                {/* Action */}
                <TableCell className="align-middle py-4">
                  {getActionBadge(event.action)}
                </TableCell>

                {/* Outcome */}
                <TableCell className="align-middle py-4">
                  <Badge variant="secondary" className="font-medium">
                    {event.outcomeTitle || `Outcome #${event.outcomeId}`}
                  </Badge>
                </TableCell>

                {/* Value */}
                <TableCell className="text-right align-middle py-4 font-medium tabular-nums">
                  {formatCurrency(event.value)}
                </TableCell>

                {/* Shares */}
                <TableCell className="text-right align-middle py-4 text-muted-foreground tabular-nums">
                  {event.shares.toFixed(2)}
                </TableCell>

                {/* Date */}
                <TableCell className="text-right align-middle py-4 text-muted-foreground text-xs whitespace-nowrap">
                  {format(new Date(event.timestamp * 1000), "MMM d, yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {hasNextPage && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Load More History"
          )}
        </Button>
      )}
    </div>
  );
}
