"use client";

/**
 * Trade Mutation Hook
 *
 * TanStack Query mutation for executing buy/sell trades on Myriad.
 * Handles the complete trade flow:
 * 1. Check token approval
 * 2. Approve if needed
 * 3. Execute the trade
 * 4. Invalidate relevant caches
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useConnectorClient } from "wagmi";
import { useCallback, useState } from "react";
import { useNetwork } from "@/lib/network-context";
import { REFERRAL_CODE } from "@/lib/config";
import {
  initializeSdk,
  getErc20Contract,
  checkApproval,
  approveToken,
  executeBuy,
  executeSell,
  type BuyParams,
  type SellParams,
} from "@/lib/myriad-sdk";
import { marketKeys } from "@/lib/queries";
import { portfolioKeys } from "@/lib/queries/portfolio";
import type { TradeAction, TransactionStatus } from "@/lib/types";

// =============================================================================
// Types
// =============================================================================

export interface TradeParams {
  /** Buy or sell */
  action: TradeAction;
  /** Market ID */
  marketId: number;
  /** Outcome ID */
  outcomeId: number;
  /** Token amount (spend for buy, receive for sell) */
  value: number;
  /** Slippage-adjusted share threshold from quote */
  sharesThreshold: number;
  /** Token contract address */
  tokenAddress: string;
}

interface TradeResult {
  /** Transaction hash */
  hash: string;
  /** Action performed */
  action: TradeAction;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for executing trades (buy/sell) on Myriad.
 *
 * Provides:
 * - `trade()` function to execute trades
 * - Loading and error states
 * - Transaction status tracking
 *
 * @example
 * ```tsx
 * function TradeButton({ marketId, outcomeId, quote }) {
 *   const { trade, isPending, status } = useTrade();
 *
 *   const handleTrade = async () => {
 *     await trade({
 *       action: "buy",
 *       marketId,
 *       outcomeId,
 *       value: 100,
 *       sharesThreshold: quote.sharesThreshold,
 *       tokenAddress: market.tokenAddress,
 *     });
 *   };
 *
 *   return (
 *     <button onClick={handleTrade} disabled={isPending}>
 *       {status === "approving" ? "Approving..." : isPending ? "Trading..." : "Buy"}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTrade() {
  const { address } = useAccount();
  const { data: connectorClient } = useConnectorClient();
  const { contracts, apiBaseUrl } = useNetwork();
  const queryClient = useQueryClient();

  // Track detailed transaction status
  const [status, setStatus] = useState<TransactionStatus>("idle");

  const mutation = useMutation({
    mutationFn: async (params: TradeParams): Promise<TradeResult> => {
      if (!address) throw new Error("Wallet not connected");
      if (!connectorClient) throw new Error("No wallet client available");

      // Get provider from connector
      const provider = await connectorClient.transport;

      // Initialize SDK
      const sdk = await initializeSdk(provider);

      // Get ERC20 contract for approval checks
      const erc20 = getErc20Contract(sdk.app, params.tokenAddress);

      // Check if we need approval (for buys only)
      if (params.action === "buy") {
        setStatus("pending_approval");

        const isApproved = await checkApproval(
          erc20,
          address,
          String(params.value * 1e6), // Assume 6 decimals for USDC
          contracts.predictionMarket
        );

        if (!isApproved) {
          setStatus("approving");
          // Approve max amount for convenience
          await approveToken(
            erc20,
            String(Number.MAX_SAFE_INTEGER),
            contracts.predictionMarket
          );
        }
      }

      // Execute the trade
      setStatus("pending_signature");

      let result;
      if (params.action === "buy") {
        const buyParams: BuyParams = {
          marketId: params.marketId,
          outcomeId: params.outcomeId,
          value: params.value,
          minOutcomeSharesToBuy: params.sharesThreshold,
        };
        result = await executeBuy(sdk.pm, buyParams, REFERRAL_CODE || undefined);
      } else {
        const sellParams: SellParams = {
          marketId: params.marketId,
          outcomeId: params.outcomeId,
          value: params.value,
          maxOutcomeSharesToSell: params.sharesThreshold,
        };
        result = await executeSell(sdk.pm, sellParams, REFERRAL_CODE || undefined);
      }

      setStatus("confirming");

      return {
        hash: result.transactionHash || result.hash || "unknown",
        action: params.action,
      };
    },

    onSuccess: (data, variables) => {
      setStatus("confirmed");

      // Invalidate relevant caches to refresh data
      queryClient.invalidateQueries({ queryKey: marketKeys.all });

      if (address) {
        queryClient.invalidateQueries({
          queryKey: portfolioKeys.user(apiBaseUrl, address),
        });
      }
    },

    onError: () => {
      setStatus("failed");
    },

    onSettled: () => {
      // Reset status after a delay
      setTimeout(() => setStatus("idle"), 3000);
    },
  });

  const trade = useCallback(
    (params: TradeParams) => mutation.mutateAsync(params),
    [mutation]
  );

  return {
    trade,
    status,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}

