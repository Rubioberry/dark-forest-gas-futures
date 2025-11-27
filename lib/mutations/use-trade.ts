"use client";

/**
 * Trade Mutation Hook
 *
 * TanStack Query mutation for executing buy/sell trades on Myriad.
 * Uses EIP-5792 sendCalls to batch approval + trade in a single popup.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useSendCalls, useCallsStatus } from "wagmi";
import { useCallback, useState, useEffect } from "react";
import { encodeFunctionData, parseUnits, type Hex } from "viem";
import { useAbstractClient } from "@abstract-foundation/agw-react";
import { toast } from "sonner";
import { useNetwork } from "@/lib/network-context";
import { TOKENS, REFERRAL_CODE, NETWORK } from "@/lib/config";
import { marketKeys, portfolioKeys } from "@/lib/queries";
import type { TradeAction, TransactionStatus } from "@/lib/types";

// =============================================================================
// ABIs
// =============================================================================

const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

const PREDICTION_MARKET_ABI = [
  {
    name: "referralBuy",
    type: "function",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "outcomeId", type: "uint256" },
      { name: "minOutcomeSharesToBuy", type: "uint256" },
      { name: "value", type: "uint256" },
      { name: "code", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "referralSell",
    type: "function",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "outcomeId", type: "uint256" },
      { name: "value", type: "uint256" },
      { name: "maxOutcomeSharesToSell", type: "uint256" },
      { name: "code", type: "string" },
    ],
    outputs: [],
  },
] as const;

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
  /** Token decimals (default 6 for USDC) */
  tokenDecimals?: number;
  /** Pre-encoded calldata from the quote API (deprecated - we encode locally now) */
  calldata?: string;
}

interface TradeResult {
  /** Transaction/bundle hash */
  hash: string;
  /** Action performed */
  action: TradeAction;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for executing trades (buy/sell) on Myriad.
 * Uses EIP-5792 sendCalls to batch approval + trade in a single wallet popup.
 */
export function useTrade() {
  const { address } = useAccount();
  const { data: abstractClient } = useAbstractClient();
  const { contracts, apiBaseUrl } = useNetwork();
  const queryClient = useQueryClient();
  const { sendCallsAsync, isPending: isSending, error: sendError } = useSendCalls();
  const [bundleId, setBundleId] = useState<string | null>(null);
  
  const { data: callsStatus, isFetching: isPolling } = useCallsStatus({
    id: bundleId as string,
    query: {
      enabled: !!bundleId,
      staleTime: 0,
      // Poll every second until we get a final state (success/failure)
      refetchInterval: (query) => {
        const txStatus = query.state.data?.status;
        if (txStatus === "success" || txStatus === "failure") return false;
        return 1000;
      },
    },
  });

  const [status, setStatus] = useState<TransactionStatus>("idle");
  const [currentAction, setCurrentAction] = useState<TradeAction | null>(null);

  useEffect(() => {
    if (!callsStatus) return;
    
    const txStatus = callsStatus.status;
    
    if (txStatus === "success") {
      setStatus("confirmed");
      console.log("Transaction confirmed! Receipts:", callsStatus.receipts);
      
      const txHash = callsStatus.receipts?.[callsStatus.receipts.length - 1]?.transactionHash;
      const explorerUrl = txHash 
        ? `${NETWORK.blockExplorer}/tx/${txHash}` 
        : undefined;
      
      toast.success(
        currentAction === "buy" ? "Purchase confirmed!" : "Sale confirmed!",
        {
          description: "Transaction confirmed on-chain",
          action: explorerUrl ? {
            label: "View",
            onClick: () => window.open(explorerUrl, "_blank"),
          } : undefined,
          duration: 5000,
        }
      );
      
      queryClient.invalidateQueries({ queryKey: marketKeys.all });
      if (address) {
        queryClient.invalidateQueries({
          queryKey: portfolioKeys.user(apiBaseUrl, address),
        });
      }
      
      setTimeout(() => {
        setStatus("idle");
        setCurrentAction(null);
        setBundleId(null);
      }, 3000);
    }
    
    if (txStatus === "failure") {
      console.error("Transaction bundle failed:", callsStatus);
      setStatus("failed");
      
      toast.error("Transaction failed", {
        description: "The transaction was reverted on-chain. Please try again.",
        duration: 5000,
      });
      
      setTimeout(() => {
        setStatus("idle");
        setCurrentAction(null);
        setBundleId(null);
      }, 3000);
    }
  }, [callsStatus, queryClient, address, apiBaseUrl, currentAction]);

  const mutation = useMutation({
    mutationFn: async (params: TradeParams): Promise<TradeResult> => {
      if (!address) throw new Error("Wallet not connected");
      if (!abstractClient) throw new Error("Abstract client not available");

      setCurrentAction(params.action);
      
      const tokenAddress = (params.tokenAddress || TOKENS.USDC.address) as Hex;
      const predictionMarketAddress = contracts.predictionMarket as Hex;
      
      if (!tokenAddress) {
        throw new Error("No token address available for this market");
      }

      const tokenDecimals = params.tokenDecimals ?? 6;
      const approvalAmount = parseUnits("1000000000000", tokenDecimals);
      const calls: Array<{ to: Hex; data: Hex; value?: bigint }> = [];
      
      // Convert to contract-expected decimals (e.g., 6 for USDC)
      const valueInDecimals = parseUnits(params.value.toString(), tokenDecimals);
      const sharesThresholdInDecimals = parseUnits(params.sharesThreshold.toString(), tokenDecimals);
      
      console.log("Trade params:", {
        action: params.action,
        marketId: params.marketId,
        outcomeId: params.outcomeId,
        value: params.value,
        valueInDecimals: valueInDecimals.toString(),
        sharesThreshold: params.sharesThreshold,
        sharesThresholdInDecimals: sharesThresholdInDecimals.toString(),
        tokenDecimals,
        referralCode: REFERRAL_CODE,
      });

      if (params.action === "buy") {
        setStatus("approving");
        
        const approveData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [predictionMarketAddress, approvalAmount],
        });
        
        calls.push({
          to: tokenAddress,
          data: approveData,
        });

        const buyData = encodeFunctionData({
          abi: PREDICTION_MARKET_ABI,
          functionName: "referralBuy",
          args: [
            BigInt(params.marketId),
            BigInt(params.outcomeId),
            sharesThresholdInDecimals,
            valueInDecimals,
            REFERRAL_CODE || "",
          ],
        });
        
        calls.push({
          to: predictionMarketAddress,
          data: buyData,
        });
      } else {
        setStatus("pending_signature");
        
        const sellData = encodeFunctionData({
          abi: PREDICTION_MARKET_ABI,
          functionName: "referralSell",
          args: [
            BigInt(params.marketId),
            BigInt(params.outcomeId),
            valueInDecimals,
            sharesThresholdInDecimals,
            REFERRAL_CODE || "",
          ],
        });
        
        calls.push({
          to: predictionMarketAddress,
          data: sellData,
        });
      }

      console.log("Sending batched calls:", calls);
      setStatus("pending_signature");

      const result = await sendCallsAsync({
        calls,
      });

      console.log("Result:", result);

      const resultBundleId = typeof result === "object" && result !== null 
        ? result.id 
        : result;
      
      setBundleId(resultBundleId);
      setStatus("confirming");

      return {
        hash: resultBundleId || "pending",
        action: params.action,
      };
    },

    onError: (error) => {
      console.error("Trade mutation error:", error);
      setStatus("failed");
      setTimeout(() => {
        setStatus("idle");
        setCurrentAction(null);
        setBundleId(null);
      }, 3000);
    },
  });

  const trade = useCallback(
    (params: TradeParams) => mutation.mutateAsync(params),
    [mutation]
  );

  const isConfirmed = callsStatus?.status === "success";
  const isFailed = callsStatus?.status === "failure";

  const reset = useCallback(() => {
    mutation.reset();
    setBundleId(null);
    setStatus("idle");
    setCurrentAction(null);
  }, [mutation]);

  return {
    trade,
    status,
    isPending: mutation.isPending || isSending,
    isConfirming: (isPolling || callsStatus?.status === "pending") && !!bundleId && !isConfirmed && !isFailed,
    isSuccess: isConfirmed,
    isError: mutation.isError || !!sendError || isFailed,
    error: mutation.error || sendError,
    data: mutation.data,
    reset,
    bundleId,
    callsStatus,
  };
}
