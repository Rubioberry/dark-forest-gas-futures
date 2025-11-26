"use client";

/**
 * Market Card Component
 *
 * Displays a market preview with:
 * - Full-width cover image
 * - Probability Bar (for binary markets)
 * - Outcome Buttons (Yes/No)
 * - Volume and liquidity stats in footer
 */

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BarChart3, Clock, DollarSign, Users } from "lucide-react";
import type { MarketSummary } from "@/lib/types";

// =============================================================================
// Helper Functions
// =============================================================================

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff < 0) return "Expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 30) {
    return expiry.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  return "< 1h";
}

function formatPercent(price: number): string {
  return `${(price * 100).toFixed(0)}%`;
}

// =============================================================================
// Binary Outcome Component (2 outcomes)
// =============================================================================

interface BinaryOutcomeProps {
  outcomes: MarketSummary["outcomes"];
}

function BinaryOutcome({ outcomes }: BinaryOutcomeProps) {
  // Assume binary markets are typically [Outcome A, Outcome B]
  // Ideally sorted so "Yes" is first or second depending on convention. 
  // Let's sort by ID or title to be consistent.
  // For "Yes/No", usually Yes is high price or first.
  
  // Find Yes/No if they exist
  const yesOutcome = outcomes.find(o => o.title.toLowerCase() === 'yes');
  const noOutcome = outcomes.find(o => o.title.toLowerCase() === 'no');
  
  // If Yes/No market, use specific order [Yes, No]
  const orderedOutcomes = yesOutcome && noOutcome 
    ? [yesOutcome, noOutcome]
    : outcomes;

  const [outcomeLeft, outcomeRight] = orderedOutcomes;
  
  // Colors for the bar
  // Left: usually green/teal/blue
  // Right: usually red/pink/orange
  const leftColor = "bg-[#10b981]"; // emerald-500
  const rightColor = "bg-[#ec4899]"; // pink-500 (or rose)

  return (
    <div className="mt-4 space-y-4">
      {/* Probability Bar */}
      <div className="flex items-center justify-between text-sm font-bold mb-1.5">
        <span className="text-emerald-500">{formatPercent(outcomeLeft.price)}</span>
        <span className="text-rose-500">{formatPercent(outcomeRight.price)}</span>
      </div>
      
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-800">
        {/* Left bar */}
        <div 
          className="absolute left-0 top-0 h-full bg-linear-to-r from-emerald-400 to-emerald-600" 
          style={{ width: `${outcomeLeft.price * 100}%` }}
        />
        {/* Right bar (background is sufficient if it's just 2, but for explicit dual color:) */}
        <div 
          className="absolute right-0 top-0 h-full bg-linear-to-l from-rose-400 to-rose-600" 
          style={{ width: `${outcomeRight.price * 100}%` }} 
        />
        {/* Gap/Separator if needed, or just let them meet */}
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button className="group relative flex items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-3 text-sm font-bold text-emerald-500 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <span className="uppercase">{outcomeLeft.title}</span>
        </button>
        <button className="group relative flex items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 py-3 text-sm font-bold text-rose-500 transition-all hover:bg-rose-500/20 hover:border-rose-500/40 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]">
          <span className="uppercase">{outcomeRight.title}</span>
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Multi Outcome Component (>2 outcomes)
// =============================================================================

interface MultiOutcomeProps {
  outcomes: MarketSummary["outcomes"];
}

function MultiOutcome({ outcomes }: MultiOutcomeProps) {
  const sortedOutcomes = [...outcomes].sort((a, b) => b.price - a.price).slice(0, 2);

  return (
    <div className="mt-3 space-y-2">
      {sortedOutcomes.map((outcome, idx) => (
        <div key={outcome.id} className="relative overflow-hidden rounded-lg bg-muted/30 p-2 hover:bg-muted/50 transition-colors">
          {/* Progress Bar Background */}
          <div 
            className="absolute inset-0 bg-primary/10"
            style={{ width: `${outcome.price * 100}%` }} 
          />
          
          <div className="relative flex items-center justify-between gap-3 z-10">
            <span className="text-sm font-medium truncate">{outcome.title}</span>
            <span className="text-sm font-bold tabular-nums text-primary">
              {formatPercent(outcome.price)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Market Card Component
// =============================================================================

interface MarketCardProps {
  market: MarketSummary;
}

export function MarketCard({ market }: MarketCardProps) {
  const isBinary = market.outcomes.length === 2;

  return (
    <Link href={`/markets/${market.slug}`} className="block h-full">
      <Card className="group h-full flex flex-col overflow-hidden border border-border/50 bg-card py-0 gap-0 transition-all hover:border-primary/50 hover:shadow-lg dark:hover:shadow-primary/5 hover:-translate-y-1 duration-300">
        
        {/* Cover Image Area */}
        <div className="relative h-40 w-full overflow-hidden bg-muted/50">
          {market.imageUrl ? (
            <Image
              src={market.imageUrl}
              alt={market.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-muted to-muted/80">
              <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
          {/* Overlay gradient for better text contrast if we put text over it (optional, currently text is below) */}
          <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <CardContent className="flex flex-1 flex-col px-4 pt-3 pb-2 relative z-10 bg-card -mt-px">
          {/* Title */}
          <div className="h-10 mb-2 flex items-center">
            <h3 className="line-clamp-2 text-base font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
              {market.title}
            </h3>
          </div>

          {/* Outcome Section */}
          <div className="flex-1">
            {isBinary ? (
              <BinaryOutcome outcomes={market.outcomes} />
            ) : (
              <MultiOutcome outcomes={market.outcomes} />
            )}
          </div>

          {/* Footer Stats */}
          <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-xs font-medium text-muted-foreground">
            
            {/* Left: Avatars/Volume/Liquidity */}
            <div className="flex items-center gap-4">
              {/* Placeholder avatars group (visual candy) - REMOVED */}
              <span className="text-foreground/80 tabular-nums">{formatCompact(market.volume24h)} Vol</span>
            </div>

            {/* Right: Date/Time */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTimeRemaining(market.expiresAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
