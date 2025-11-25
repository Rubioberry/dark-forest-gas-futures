"use client";

/**
 * Market Detail Page
 *
 * Single-page market view with:
 * - Compact header with market info
 * - Price chart with legend
 * - Integrated trade panel with outcome selection
 * - Rules and Timeline sections
 */

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ChevronUp, ChevronDown, CheckCircle, Circle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useNetwork } from "@/lib/network-context";
import { marketQueryOptions } from "@/lib/queries";
import { PriceChart } from "@/components/market/price-chart";
import { TradePanel } from "@/components/market/trade-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M pts`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K pts`;
  return `${value.toFixed(0)} pts`;
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function MarketDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Skeleton className="mb-4 h-6 w-32" />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Skeleton className="h-[500px] w-full rounded-lg" />
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    </div>
  );
}

// =============================================================================
// Page Component
// =============================================================================

export default function MarketDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { apiBaseUrl, networkConfig } = useNetwork();

  // UI state
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<number | null>(null);
  const [rulesExpanded, setRulesExpanded] = useState(true);
  const [timelineExpanded, setTimelineExpanded] = useState(true);

  // Fetch market data
  const { data: market, isPending, error } = useQuery(marketQueryOptions(apiBaseUrl, slug));

  // Set initial selected outcome to the most likely (highest probability)
  if (market && selectedOutcomeId === null && market.outcomes.length > 0) {
    const sortedOutcomes = [...market.outcomes].sort((a, b) => b.price - a.price);
    setSelectedOutcomeId(sortedOutcomes[0].id);
  }

  if (isPending) {
    return <MarketDetailSkeleton />;
  }

  if (error || !market) {
    const isAuthError = error && 'statusCode' in error && error.statusCode === 401;
    
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {isAuthError ? "API Key Required" : "Market not found"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isAuthError 
              ? "Please set NEXT_PUBLIC_MYRIAD_API_KEY in your .env.local file. Contact Myriad to obtain an API key."
              : "The market you're looking for doesn't exist or has been removed."}
          </p>
          <Button asChild className="mt-4">
            <Link href="/">Back to Markets</Link>
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Back Link */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Markets
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left Column - Chart and Info */}
        <div className="space-y-6">
          {/* Market Header - Compact */}
          <div className="flex items-start gap-4">
            {market.imageUrl && (
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={market.imageUrl}
                  alt={market.title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold leading-tight">{market.title}</h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="font-medium text-foreground">{formatCompact(market.volume)}</span>
                </span>
                <span>|</span>
                <span>{formatDate(market.expiresAt)}</span>
              </div>
            </div>
          </div>

          {/* Outcome Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {[...market.outcomes]
              .sort((a, b) => b.price - a.price)
              .map((outcome, index) => {
                const originalIndex = market.outcomes.findIndex(o => o.id === outcome.id);
                // Use chart colors from globals.css
                const colorVar = `var(--chart-${(originalIndex % 10) + 1})`;
                return (
                  <div key={outcome.id} className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: colorVar }}
                    />
                    <span>{outcome.title}</span>
                    <span className="font-medium">{(outcome.price * 100).toFixed(1)}%</span>
                  </div>
                );
              })}
          </div>

          {/* Price Chart */}
          <div className="rounded-xl border border-border bg-card p-4">
            <PriceChart
              outcomes={market.outcomes}
              selectedOutcomeId={selectedOutcomeId ?? undefined}
            />
          </div>

          {/* Rules Section */}
          <div className="rounded-xl border border-border bg-card">
            <button
              onClick={() => setRulesExpanded(!rulesExpanded)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="font-semibold">Rules</span>
              {rulesExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            
            {rulesExpanded && (
              <div className="px-4 pb-4 text-sm">
                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-medium prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-blue-500 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
                  <ReactMarkdown>
                    {market.description || "No rules specified for this market."}
                  </ReactMarkdown>
                </div>
                
                {/* Resolution Source */}
                {market.resolutionSource && (
                  <div className="flex items-center gap-2 pt-4 mt-4 border-t border-border">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Resolution Source</span>
                    <a
                      href={market.resolutionSource.startsWith('http') ? market.resolutionSource : `https://${market.resolutionSource}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {market.resolutionSource}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resolution Info (if resolved) */}
          {market.state === "resolved" && market.resolvedOutcomeId !== null && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <h3 className="font-semibold text-emerald-600 dark:text-emerald-400">
                Market Resolved
              </h3>
              <p className="mt-1 text-sm">
                Winning outcome:{" "}
                <span className="font-medium">
                  {market.outcomes.find((o) => o.id === market.resolvedOutcomeId)?.title}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Trade Panel and Timeline */}
        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          {selectedOutcomeId !== null && (
            <TradePanel
              market={market}
              selectedOutcomeId={selectedOutcomeId}
              onOutcomeChange={setSelectedOutcomeId}
            />
          )}

          {/* Timeline Section */}
          <div className="rounded-xl border border-border bg-card">
            <button
              onClick={() => setTimelineExpanded(!timelineExpanded)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="font-semibold">Timeline</span>
              {timelineExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            
            {timelineExpanded && (
              <div className="px-4 pb-4">
                <div className="relative space-y-4">
                  {/* Timeline line */}
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                  
                  {/* Market published */}
                  <div className="flex gap-3 items-start relative">
                    <CheckCircle className="h-6 w-6 text-emerald-500 bg-card flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Market published</p>
                      <p className="text-xs text-muted-foreground">
                        {market.publishedAt ? formatDate(market.publishedAt) : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Market closes */}
                  <div className="flex gap-3 items-start relative">
                    <Circle className="h-6 w-6 text-muted-foreground bg-card flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Market closes</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(market.expiresAt)}
                      </p>
                    </div>
                  </div>

                  {/* Resolution */}
                  <div className="flex gap-3 items-start relative">
                    <Circle className="h-6 w-6 text-muted-foreground bg-card flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Resolution</p>
                      <p className="text-xs text-muted-foreground">
                        The outcome will be validated by the team within 24 hours of its occurrence.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
