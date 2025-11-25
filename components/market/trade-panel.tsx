"use client";

/**
 * Trade Panel Component
 *
 * Compact trading form with integrated outcome selection.
 * Matches the Myriad app design with:
 * - Buy/Sell tabs
 * - Compact outcome selector
 * - Amount input
 * - Quote preview stats
 * - Execute trade button
 */

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useNetwork } from "@/lib/network-context";
import { getQuote } from "@/lib/myriad-api";
import { useTrade } from "@/lib/mutations";
import { cn } from "@/lib/utils";
import type { Market, TradeAction, Quote } from "@/lib/types";

// =============================================================================
// Types
// =============================================================================

interface TradePanelProps {
  market: Market;
  selectedOutcomeId: number;
  onOutcomeChange?: (outcomeId: number) => void;
}

// =============================================================================
// Component
// =============================================================================

export function TradePanel({ market, selectedOutcomeId, onOutcomeChange }: TradePanelProps) {
  const { status, address } = useAccount();
  const isConnected = status === "connected";
  const { apiBaseUrl, networkConfig } = useNetwork();
  const { trade, isPending: isTrading, status: tradeStatus } = useTrade();

  // Form state
  const [action, setAction] = useState<TradeAction>("buy");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const selectedOutcome = market.outcomes.find((o) => o.id === selectedOutcomeId);
  const sortedOutcomes = [...market.outcomes].sort((a, b) => b.price - a.price);

  // Fetch quote when amount changes
  const fetchQuote = useCallback(async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      setQuote(null);
      return;
    }

    setIsLoadingQuote(true);
    setQuoteError(null);

    try {
      const newQuote = await getQuote(apiBaseUrl, {
        marketId: market.id,
        networkId: networkConfig.id,
        outcomeId: selectedOutcomeId,
        action,
        value,
        slippage: 0.01, // 1% slippage
      });
      setQuote(newQuote);
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : "Failed to get quote");
      setQuote(null);
    } finally {
      setIsLoadingQuote(false);
    }
  }, [apiBaseUrl, market.id, networkConfig.id, selectedOutcomeId, action, amount]);

  // Debounced quote fetch
  useEffect(() => {
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  // Handle trade execution
  const handleTrade = async () => {
    if (!quote || !amount) return;

    try {
      await trade({
        action,
        marketId: market.id,
        outcomeId: selectedOutcomeId,
        value: parseFloat(amount),
        sharesThreshold: quote.sharesThreshold,
        tokenAddress: market.tokenAddress,
      });

      // Reset form on success
      setAmount("");
      setQuote(null);
    } catch (err) {
      console.error("Trade failed:", err);
    }
  };

  // Market closed check
  const isMarketOpen = market.state === "open";

  // Calculate max profit for display
  const maxProfit = quote
    ? action === "buy"
      ? quote.shares - parseFloat(amount) - quote.fees.fee
      : parseFloat(amount) - quote.fees.fee
    : 0;
  
  const maxProfitPercent = quote && parseFloat(amount) > 0
    ? (maxProfit / parseFloat(amount)) * 100
    : 0;

  return (
    <Card className="bg-card border-border py-0 overflow-hidden">
      <CardContent className="p-0">
        {/* Buy/Sell Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setAction("buy")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              action === "buy"
                ? "text-foreground border-b-2 border-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Buy
          </button>
          <button
            onClick={() => setAction("sell")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              action === "sell"
                ? "text-foreground border-b-2 border-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sell
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Outcome Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Select outcome</span>
              <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
            </div>
            <div className="space-y-1">
              {sortedOutcomes.map((outcome, index) => {
                const originalIndex = market.outcomes.findIndex(o => o.id === outcome.id);
                const isSelected = selectedOutcomeId === outcome.id;
                const colorVar = `var(--chart-${(originalIndex % 10) + 1})`;
                return (
                  <button
                    key={outcome.id}
                    onClick={() => onOutcomeChange?.(outcome.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                      isSelected
                        ? "bg-accent"
                        : "hover:bg-accent/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: colorVar }}
                      />
                      <span className={cn(
                        "truncate max-w-[180px]",
                        isSelected && "font-medium"
                      )}>
                        {outcome.title}
                      </span>
                    </div>
                    <span className={cn(
                      "font-medium tabular-nums",
                      isSelected && "text-foreground"
                    )}>
                      {(outcome.price * 100).toFixed(1)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-sm text-muted-foreground block mb-2">
              Amount
            </label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!isMarketOpen}
              min="0"
              step="0.01"
              className="bg-background"
            />
          </div>

          {/* Action Button */}
          {!isConnected ? (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={openConnectModal}
                >
                  Login
                </Button>
              )}
            </ConnectButton.Custom>
          ) : !isMarketOpen ? (
            <Button className="w-full" disabled>
              Market Closed
            </Button>
          ) : (
            <Button
              className={cn(
                "w-full",
                action === "buy"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700",
                "text-white"
              )}
              onClick={handleTrade}
              disabled={!quote || isTrading || isLoadingQuote}
            >
              {isTrading
                ? tradeStatus === "approving"
                  ? "Approving..."
                  : tradeStatus === "pending_signature"
                    ? "Confirm in wallet..."
                    : "Processing..."
                : action === "buy" ? "Buy" : "Sell"}
            </Button>
          )}

          {/* Quote Error */}
          {quoteError && (
            <p className="text-sm text-destructive">{quoteError}</p>
          )}

          {/* Stats Section */}
          <div className="pt-2 space-y-2 text-sm">
            {isLoadingQuote ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </>
            ) : (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>Price change</span>
                  <span className="text-foreground tabular-nums">
                    {quote
                      ? `${(quote.priceBefore * 100).toFixed(2)} pts → ${(quote.priceAfter * 100).toFixed(2)} pts`
                      : "0.00 pts → 0.00 pts"}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shares</span>
                  <span className="text-foreground tabular-nums">
                    {quote?.shares.toFixed(2) ?? "0"}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Avg. price</span>
                  <span className="text-foreground tabular-nums">
                    {quote ? `${(quote.priceAverage * 100).toFixed(2)} pts` : "0.00 pts"}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Max profit</span>
                  <span className={cn(
                    "tabular-nums",
                    maxProfit > 0 ? "text-emerald-500" : maxProfit < 0 ? "text-rose-500" : "text-foreground"
                  )}>
                    {maxProfit > 0 ? "+" : ""}{maxProfit.toFixed(2)} pts ({maxProfitPercent > 0 ? "+" : ""}{maxProfitPercent.toFixed(0)}%)
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Max payout</span>
                  <span className="text-foreground tabular-nums">
                    {quote?.shares.toFixed(2) ?? "0.00"} pts
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
