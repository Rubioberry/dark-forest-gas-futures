"use client";

/**
 * Claim Mutation Hook
 *
 * TanStack Query mutation for claiming winnings or voided shares.
 * Automatically determines the correct claim type based on market state.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useConnectorClient } from "wagmi";
import { useCallback, useState } from "react";
import { useNetwork } from "@/lib/network-context";
import { initializeSdk, claimWinnings, claimVoided } from "@/lib/myriad-sdk";
import { marketKeys, portfolioKeys } from "@/lib/queries";
import type { ClaimAction, TransactionStatus } from "@/lib/types";

// =============================================================================
// Types
// =============================================================================

export interface ClaimParams {
  /** Type of claim */
  action: ClaimAction;
  /** Market ID */
  marketId: number;
  /** Outcome ID (required for voided claims) */
  outcomeId?: number;
}

interface ClaimResult {
  /** Transaction hash */
  hash: string;
  /** Action performed */
  action: ClaimAction;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for claiming winnings or voided shares.
 *
 * @example
 * ```tsx
 * function ClaimButton({ position }) {
 *   const { claim, isPending } = useClaim();
 *
 *   const handleClaim = async () => {
 *     await claim({
 *       action: position.winningsToClaim ? "claim_winnings" : "claim_voided",
 *       marketId: position.marketId,
 *       outcomeId: position.outcomeId,
 *     });
 *   };
 *
 *   return (
 *     <button onClick={handleClaim} disabled={isPending}>
 *       {isPending ? "Claiming..." : "Claim"}
 *     </button>
 *   );
 * }
 * ```
 */
export function useClaim() {
  const { address } = useAccount();
  const { data: connectorClient } = useConnectorClient();
  const { apiBaseUrl } = useNetwork();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<TransactionStatus>("idle");

  const mutation = useMutation({
    mutationFn: async (params: ClaimParams): Promise<ClaimResult> => {
      if (!address) throw new Error("Wallet not connected");
      if (!connectorClient) throw new Error("No wallet client available");

      const provider = await connectorClient.transport;
      const sdk = await initializeSdk(provider);

      setStatus("pending_signature");

      let result;
      if (params.action === "claim_winnings") {
        result = await claimWinnings(sdk.pm, params.marketId);
      } else if (params.action === "claim_voided" && params.outcomeId !== undefined) {
        result = await claimVoided(sdk.pm, params.marketId, params.outcomeId);
      } else {
        throw new Error("Invalid claim parameters");
      }

      setStatus("confirming");

      return {
        hash: result.transactionHash || result.hash || "unknown",
        action: params.action,
      };
    },

    onSuccess: () => {
      setStatus("confirmed");

      // Invalidate caches
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
      setTimeout(() => setStatus("idle"), 3000);
    },
  });

  const claim = useCallback(
    (params: ClaimParams) => mutation.mutateAsync(params),
    [mutation]
  );

  return {
    claim,
    status,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}

