"use client";

/**
 * Positions Table Component
 *
 * Displays a user's portfolio positions in a sortable table.
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Position, PositionStatus } from "@/lib/types";
import { 
  ArrowUpDown, 
  ExternalLink,
  BarChart3 
} from "lucide-react";

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

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}

function getStatusBadge(status: PositionStatus) {
  switch (status) {
    case "ongoing":
      return { label: "Active", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20" };
    case "won":
      return { label: "Won", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
    case "lost":
      return { label: "Lost", className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20" };
    case "claimed":
      return { label: "Claimed", className: "bg-muted text-muted-foreground border-border" };
    case "sold":
      return { label: "Sold", className: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20" };
    default:
      return { label: status, className: "bg-muted text-muted-foreground border-border" };
  }
}

// =============================================================================
// Component
// =============================================================================

interface PositionsTableProps {
  positions: Position[];
  className?: string;
}

type SortField = "value" | "profit" | "roi" | "shares" | "price" | "invested";
type SortOrder = "asc" | "desc";

export function PositionsTable({ positions, className }: PositionsTableProps) {
  const [sortField, setSortField] = useState<SortField>("value");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedPositions = [...positions].map(p => ({
    ...p,
    invested: p.value - p.profit
  })).sort((a, b) => {
    const aValue = a[sortField] ?? 0;
    const bValue = b[sortField] ?? 0;
    
    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />;
    return <ArrowUpDown className={cn("ml-2 h-3 w-3", sortOrder === "asc" ? "rotate-180" : "")} />;
  };

  return (
    <div className={cn("rounded-md border border-border/50 overflow-hidden", className)}>
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="w-[300px]">Market</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("shares")}>
              <div className="flex items-center justify-end">
                Shares <SortIcon field="shares" />
              </div>
            </TableHead>
            <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("price")}>
               <div className="flex items-center justify-end">
                Avg Price <SortIcon field="price" />
              </div>
            </TableHead>
            <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("invested")}>
               <div className="flex items-center justify-end">
                Invested <SortIcon field="invested" />
              </div>
            </TableHead>
            <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("value")}>
               <div className="flex items-center justify-end">
                Value <SortIcon field="value" />
              </div>
            </TableHead>
            <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("profit")}>
               <div className="flex items-center justify-end">
                P&L <SortIcon field="profit" />
              </div>
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPositions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                No positions found.
              </TableCell>
            </TableRow>
          ) : (
            sortedPositions.map((position) => {
              const statusConfig = getStatusBadge(position.status);
              const isProfitable = position.profit >= 0;

              return (
                <TableRow 
                  key={`${position.marketId}-${position.outcomeId}`} 
                  className={cn(
                    "group border-border/50 hover:bg-muted/30 relative overflow-hidden",
                    isProfitable ? "bg-linear-to-r from-emerald-500/5 via-transparent to-transparent" : "bg-linear-to-r from-rose-500/5 via-transparent to-transparent"
                  )}
                >
                  {/* Market Info */}
                  <TableCell className="align-top py-4">
                    <Link href={`/markets/${position.marketSlug}`} className="flex gap-3 group/market">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        {position.imageUrl ? (
                          <Image
                            src={position.imageUrl}
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
                        <span className="font-medium text-sm truncate group-hover/market:text-primary transition-colors">
                          {position.marketTitle || `Market #${position.marketId}`}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                           <Badge variant="outline" className={cn("text-[10px] px-1.5 h-5 font-normal", statusConfig.className)}>
                              {statusConfig.label}
                           </Badge>
                        </div>
                      </div>
                    </Link>
                  </TableCell>

                  {/* Outcome */}
                  <TableCell className="align-top py-4">
                    <Badge variant="secondary" className="font-medium">
                      {position.outcomeTitle || `Outcome #${position.outcomeId}`}
                    </Badge>
                  </TableCell>

                  {/* Shares */}
                  <TableCell className="text-right align-top py-4 font-medium tabular-nums">
                    {position.shares.toFixed(2)}
                  </TableCell>

                  {/* Avg Price */}
                  <TableCell className="text-right align-top py-4 text-muted-foreground tabular-nums">
                    {formatCurrency(position.price)}
                  </TableCell>

                  {/* Invested */}
                  <TableCell className="text-right align-top py-4 text-muted-foreground tabular-nums">
                    {formatCurrency(position.invested ?? position.value - position.profit)}
                  </TableCell>

                  {/* Value */}
                  <TableCell className="text-right align-top py-4 font-medium tabular-nums">
                    {formatCurrency(position.value)}
                  </TableCell>

                  {/* P&L */}
                  <TableCell className="text-right align-top py-4">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={cn("font-medium tabular-nums", isProfitable ? "text-emerald-500" : "text-rose-500")}>
                        {isProfitable ? "+" : ""}
                        {formatCurrency(position.profit)}
                      </span>
                      <span className={cn("text-xs tabular-nums", isProfitable ? "text-emerald-500/70" : "text-rose-500/70")}>
                        {formatPercent(position.roi)}
                      </span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="align-top py-4 text-right">
                    <Link 
                      href={`/markets/${position.marketSlug}`} 
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <span className="sr-only">View market</span>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
