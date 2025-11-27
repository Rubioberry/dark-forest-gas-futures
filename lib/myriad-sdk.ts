/**
 * Myriad SDK Integration
 *
 * Wrapper around polkamarkets-js SDK for on-chain operations.
 * The SDK handles:
 * - ERC20 approvals
 * - Buying/selling outcome shares
 * - Claiming winnings and voided shares
 *
 * Note: This module is client-side only due to polkamarkets-js dependencies.
 * Always import dynamically or use in client components.
 */

import { CONTRACTS, NETWORK } from "./config";

// =============================================================================
// Types
// =============================================================================

// We use `any` here because polkamarkets-js types aren't exported properly
// and we need to handle dynamic imports
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Initialized SDK instance with prediction market contract.
 */
export interface MyriadSdk {
  /** The polkamarkets application instance */
  app: any;
  /** The prediction market contract instance */
  pm: any;
}

// =============================================================================
// SDK Initialization
// =============================================================================

/**
 * Dynamically import polkamarkets-js to avoid SSR issues.
 * The library has Node.js-only dependencies that break SSR.
 */
async function getPolkamarketsJs() {
  const polkamarketsjs = await import("polkamarkets-js");
  return polkamarketsjs;
}

/**
 * Initialize the Myriad SDK with an EIP-1193 provider.
 *
 * The SDK requires an EIP-1193 provider (e.g., from wagmi's connector.getProvider()) to:
 * - Sign transactions
 * - Read contract state
 * - Execute trades
 *
 * Note: polkamarkets-js uses web3.js internally, which expects EIP-1193 providers.
 * The viem transport objects from wagmi are NOT compatible - use connector.getProvider() instead.
 *
 * @param provider - EIP-1193 provider from wallet connector
 * @returns Initialized SDK instance
 *
 * @example
 * ```ts
 * const provider = await connector.getProvider();
 * const sdk = await initializeSdk(provider);
 *
 * // Now use sdk.pm.buy(), sdk.pm.sell(), etc.
 * ```
 */
/**
 * Clean transaction parameters for AGW compatibility.
 * Removes or fixes null values that polkamarkets-js sends but AGW/viem can't handle.
 */
function cleanTransactionParams(params: any[]): any[] {
  return params.map(param => {
    if (typeof param === 'object' && param !== null) {
      const cleaned = { ...param };
      
      // Remove null gas parameters so AGW can estimate them
      if (cleaned.gasPrice === null) delete cleaned.gasPrice;
      if (cleaned.maxFeePerGas === null) delete cleaned.maxFeePerGas;
      if (cleaned.maxPriorityFeePerGas === null) delete cleaned.maxPriorityFeePerGas;
      if (cleaned.gas === null) delete cleaned.gas;
      if (cleaned.gasLimit === null) delete cleaned.gasLimit;
      if (cleaned.nonce === null) delete cleaned.nonce;
      if (cleaned.value === null || cleaned.value === undefined) {
        cleaned.value = "0x0";
      }
      
      return cleaned;
    }
    return param;
  });
}

/**
 * Wrap an EIP-1193 provider to be compatible with web3.js v1.x
 * Web3.js expects certain properties that may not exist on all EIP-1193 providers
 */
function wrapProviderForWeb3(eip1193Provider: any) {
  const eventHandlers: Record<string, Array<(...args: any[]) => void>> = {};
  const TX_METHODS = ['eth_sendTransaction', 'eth_signTransaction', 'eth_call', 'eth_estimateGas'];
  
  const wrappedProvider = {
    supportsSubscriptions: () => false,
    
    send: (payload: any, callback: any) => {
      if (Array.isArray(payload)) {
        Promise.all(
          payload.map((p: any) => {
            const params = TX_METHODS.includes(p.method) 
              ? cleanTransactionParams(p.params || [])
              : (p.params || []);
            return eip1193Provider.request({
              method: p.method,
              params,
            }).then((result: any) => ({ id: p.id, jsonrpc: "2.0", result }))
              .catch((error: any) => ({ id: p.id, jsonrpc: "2.0", error }));
          })
        ).then((results) => callback(null, results))
          .catch((error) => callback(error, null));
        return;
      }
      
      const params = TX_METHODS.includes(payload.method)
        ? cleanTransactionParams(payload.params || [])
        : (payload.params || []);
      
      eip1193Provider
        .request({
          method: payload.method,
          params,
        })
        .then((result: any) => {
          callback(null, { id: payload.id, jsonrpc: "2.0", result });
        })
        .catch((error: any) => {
          callback(error, null);
        });
    },
    
    sendAsync: function(payload: any, callback: any) {
      return wrappedProvider.send(payload, callback);
    },
    
    request: (args: { method: string; params?: any[] }) => {
      const params = TX_METHODS.includes(args.method)
        ? cleanTransactionParams(args.params || [])
        : args.params;
      
      return eip1193Provider.request({ method: args.method, params });
    },
    
    connected: true,
    isConnected: () => true,
    
    on: (event: string, handler: (...args: any[]) => void) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(handler);
      return wrappedProvider;
    },
    removeListener: (event: string, handler: (...args: any[]) => void) => {
      if (eventHandlers[event]) {
        const idx = eventHandlers[event].indexOf(handler);
        if (idx > -1) {
          eventHandlers[event].splice(idx, 1);
        }
      }
      return wrappedProvider;
    },
    removeAllListeners: (event?: string) => {
      if (event) {
        delete eventHandlers[event];
      } else {
        Object.keys(eventHandlers).forEach(k => delete eventHandlers[k]);
      }
      return wrappedProvider;
    },
    emit: (event: string, ...args: any[]) => {
      if (eventHandlers[event]) {
        eventHandlers[event].forEach(handler => handler(...args));
      }
      return true;
    },
    listeners: (event: string) => eventHandlers[event] || [],
    listenerCount: (event: string) => (eventHandlers[event] || []).length,
    host: "abstract-global-wallet",
  };
  
  return wrappedProvider;
}

export async function initializeSdk(provider: unknown): Promise<MyriadSdk> {
  const polkamarketsjs = await getPolkamarketsJs();
  const wrappedProvider = wrapProviderForWeb3(provider);

  const app = new polkamarketsjs.Application({
    web3Provider: NETWORK.rpcUrl,
    web3EventsProvider: NETWORK.rpcUrl,
  });

  app.start();

  // Set the provider on the existing web3 instance (avoids subscription issues)
  try {
    if (app.web3.setProvider) {
      app.web3.setProvider(wrappedProvider);
    } else if (app.web3.currentProvider) {
      app.web3.currentProvider = wrappedProvider;
    }
  } catch (e) {
    console.warn("Failed to set provider via setProvider, using direct assignment:", e);
    if (app.web3.eth && app.web3.eth.currentProvider !== undefined) {
      app.web3.eth.currentProvider = wrappedProvider;
    }
  }

  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).web3 = app.web3;
  }

  const pm = app.getPredictionMarketV3PlusContract({
    contractAddress: CONTRACTS.predictionMarket,
    querierContractAddress: CONTRACTS.predictionMarketQuerier,
  });

  return { app, pm };
}

// =============================================================================
// Claim Operations
// =============================================================================

/**
 * Claim winnings from a resolved market.
 *
 * @param pm - Prediction market contract instance
 * @param marketId - Market ID
 * @param wrapped - Whether to unwrap to native token
 */
export async function claimWinnings(pm: any, marketId: number, wrapped?: boolean) {
  return pm.claimWinnings({
    marketId,
    wrapped,
  });
}

/**
 * Claim voided shares from a cancelled market.
 *
 * @param pm - Prediction market contract instance
 * @param marketId - Market ID
 * @param outcomeId - Outcome ID to claim
 * @param wrapped - Whether to unwrap to native token
 */
export async function claimVoided(
  pm: any,
  marketId: number,
  outcomeId: number,
  wrapped?: boolean
) {
  return pm.claimVoidedOutcomeShares({
    marketId,
    outcomeId,
    wrapped,
  });
}
