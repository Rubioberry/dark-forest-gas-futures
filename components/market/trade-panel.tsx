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

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import { useQuery } from "@tanstack/react-query";
import { ConnectWalletButton } from "@/components/connect-wallet-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useNetwork } from "@/lib/network-context";
import { getQuote } from "@/lib/myriad-api";
import { useTrade } from "@/lib/mutations";
import { portfolioQueryOptions } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { TOKENS } from "@/lib/config";
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
  const { trade, isPending: isTrading, isConfirming, status: tradeStatus } = useTrade();

  const [action, setAction] = useState<TradeAction>("buy");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const selectedOutcome = market.outcomes.find((o) => o.id === selectedOutcomeId);
  const sortedOutcomes = [...market.outcomes].sort((a, b) => b.price - a.price);

  const { data: usdcBalanceRaw } = useReadContract({
    address: TOKENS.USDC.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && action === "buy",
      refetchInterval: 10000,
    },
  });

  const usdcBalance = useMemo(() => {
    if (!usdcBalanceRaw) return 0;
    return parseFloat(formatUnits(usdcBalanceRaw, TOKENS.USDC.decimals));
  }, [usdcBalanceRaw]);

  const { data: portfolioData } = useQuery({
    ...portfolioQueryOptions(apiBaseUrl, address ?? "", {
      networkId: networkConfig.id,
      marketId: market.id,
    }),
    enabled: !!address && action === "sell",
  });

  const sharesBalance = useMemo(() => {
    if (!portfolioData?.data) return 0;
    const position = portfolioData.data.find(
      (p) => p.outcomeId === selectedOutcomeId
    );
    return position?.shares ?? 0;
  }, [portfolioData, selectedOutcomeId]);

  const sharesValueUsd = useMemo(() => {
    if (!selectedOutcome || sharesBalance <= 0) return 0;
    return sharesBalance * selectedOutcome.price;
  }, [sharesBalance, selectedOutcome]);

  const availableBalanceUsd = action === "buy" ? usdcBalance : sharesValueUsd;

  const handlePercentageClick = (percent: number) => {
    const value = availableBalanceUsd * (percent / 100);
    if (value > 0) {
      setAmount(value.toFixed(2));
    }
  };

  const fetchQuote = useCallback(async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setQuote(null);
      return;
    }

    setIsLoadingQuote(true);
    setQuoteError(null);

    try {
      let quoteParams: { value?: number; shares?: number };
      
      if (action === "buy") {
        quoteParams = { value: parsedAmount };
      } else {
        // For sell: convert USD value to shares (shares = usd / price)
        const price = selectedOutcome?.price ?? 0;
        if (price <= 0) {
          setQuoteError("Invalid price");
          setQuote(null);
          setIsLoadingQuote(false);
          return;
        }
        const sharesToSell = parsedAmount / price;
        quoteParams = { shares: sharesToSell };
      }

      const newQuote = await getQuote(apiBaseUrl, {
        marketId: market.id,
        networkId: networkConfig.id,
        outcomeId: selectedOutcomeId,
        action,
        ...quoteParams,
        slippage: 0.01,
      });
      setQuote(newQuote);
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : "Failed to get quote");
      setQuote(null);
    } finally {
      setIsLoadingQuote(false);
    }
  }, [apiBaseUrl, market.id, networkConfig.id, selectedOutcomeId, action, amount, selectedOutcome?.price]);

  useEffect(() => {
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  const handleTrade = async () => {
    if (!quote || !amount) return;

    try {
      // For sell: calculate max shares to sell with 1% slippage buffer
      // For buy: use API's min shares threshold
      const sharesThreshold = action === "sell" 
        ? quote.shares * 1.01
        : quote.sharesThreshold;

      await trade({
        action,
        marketId: market.id,
        outcomeId: selectedOutcomeId,
        value: quote.value,
        sharesThreshold,
        tokenAddress: market.tokenAddress,
        tokenDecimals: 6,
      });

      setAmount("");
      setQuote(null);
    } catch (err) {
      console.error("Trade failed:", err);
    }
  };

  const isMarketOpen = market.state === "open";

  // Max profit: (buy) potential payout - cost - fees, (sell) USDC received - fees
  const maxProfit = quote
    ? action === "buy"
      ? quote.shares - quote.value - quote.fees.fee
      : quote.value - quote.fees.fee
    : 0;

  const maxProfitPercent = quote
    ? action === "buy" && quote.value > 0
      ? (maxProfit / quote.value) * 100
      : action === "sell" && parseFloat(amount) > 0
        ? ((quote.value - quote.fees.fee) / parseFloat(amount) - 1) * 100
        : 0
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
                let colorVar = `var(--chart-${(originalIndex % 10) + 1})`;
                
                if (outcome.title.toLowerCase() === "yes") colorVar = "#10b981";
                if (outcome.title.toLowerCase() === "no") colorVar = "#f43f5e";

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
        </div>

        <div className="h-px bg-border" />

        <div className="p-4 space-y-4">
          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-muted-foreground">
                Amount
              </label>
              {isConnected && (
                <span className="text-sm text-muted-foreground">
                  Available{" "}
                  <span className="text-foreground font-medium">
                    ${availableBalanceUsd.toFixed(2)}
                  </span>
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!isMarketOpen}
                  min="0"
                  step="0.01"
                  className="bg-background pl-7 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="flex gap-1">
                {[25, 50, 100].map((percent) => (
                  <Button
                    key={percent}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="px-2 h-9 text-xs"
                    onClick={() => handlePercentageClick(percent)}
                    disabled={!isMarketOpen || !isConnected || availableBalanceUsd <= 0}
                  >
                    {percent}%
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          {!isConnected ? (
            <ConnectWalletButton className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" />
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
              disabled={!quote || isTrading || isConfirming || isLoadingQuote}
            >
              {isTrading || isConfirming
                ? tradeStatus === "approving"
                  ? "Approving..."
                  : tradeStatus === "pending_signature"
                    ? "Confirm in wallet..."
                    : tradeStatus === "confirming"
                      ? "Confirming..."
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
            <div className="flex justify-between text-muted-foreground">
              <span>Price change</span>
              {isLoadingQuote ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                <span className="text-foreground tabular-nums">
                  {quote
                    ? `${(quote.priceBefore * 100).toFixed(1)}¢ → ${(quote.priceAfter * 100).toFixed(1)}¢`
                    : "—"}
                </span>
              )}
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{action === "buy" ? "Shares" : "Shares to sell"}</span>
              {isLoadingQuote ? (
                <Skeleton className="h-4 w-12" />
              ) : (
                <span className="text-foreground tabular-nums">
                  {quote?.shares.toFixed(2) ?? "—"}
                </span>
              )}
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Avg. price</span>
              {isLoadingQuote ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <span className="text-foreground tabular-nums">
                  {quote ? `$${quote.priceAverage.toFixed(3)}/share` : "—"}
                </span>
              )}
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{action === "buy" ? "Max profit" : "Est. return"}</span>
              {isLoadingQuote ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <span className={cn(
                  "tabular-nums",
                  maxProfit > 0 ? "text-emerald-500" : maxProfit < 0 ? "text-rose-500" : "text-foreground"
                )}>
                  {quote
                    ? action === "buy"
                      ? `${maxProfit >= 0 ? "+$" : "-$"}${Math.abs(maxProfit).toFixed(2)} (${maxProfitPercent >= 0 ? "+" : ""}${maxProfitPercent.toFixed(0)}%)`
                      : `$${(quote.value - quote.fees.fee).toFixed(2)}`
                    : "—"}
                </span>
              )}
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{action === "buy" ? "Max payout" : "Fees"}</span>
              {isLoadingQuote ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <span className="text-foreground tabular-nums">
                  {quote 
                    ? action === "buy" 
                      ? `$${quote.shares.toFixed(2)}`
                      : `$${quote.fees.fee.toFixed(2)}`
                    : "—"}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
