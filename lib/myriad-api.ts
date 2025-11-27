/**
 * Myriad REST API Client
 *
 * Typed client for interacting with the Myriad Protocol REST API.
 * All data fetching (markets, portfolios, quotes) goes through this client.
 *
 * API Documentation: https://api-v2.myriadprotocol.com
 *
 * Note: All endpoints except health require an API key.
 * Set NEXT_PUBLIC_MYRIAD_API_KEY in your environment.
 */

import { MYRIAD_API_KEY, DEFAULT_PAGE_SIZE, DEFAULT_SLIPPAGE } from "./config";
import type {
  MarketsQueryParams,
  MarketsResponse,
  MarketResponse,
  PortfolioQueryParams,
  PortfolioResponse,
  UserEventsQueryParams,
  UserEventsResponse,
  ApiError,
} from "./types";
import type { QuoteRequest, Quote, ClaimRequest, ClaimResponse } from "./types";

// =============================================================================
// API Client Configuration
// =============================================================================

/**
 * Default headers for API requests.
 * Includes API key authentication.
 */
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (MYRIAD_API_KEY) {
    headers["x-api-key"] = MYRIAD_API_KEY;
  }

  return headers;
}

/**
 * Custom error class for API errors.
 */
export class MyriadApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: ApiError
  ) {
    super(message);
    this.name = "MyriadApiError";
  }
}

/**
 * Make a GET request to the Myriad API.
 */
async function apiGet<T>(baseUrl: string, path: string, params?: Record<string, unknown>): Promise<T> {
  const url = new URL(path, baseUrl);

  // Add query parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        // Convert camelCase to snake_case for API
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        url.searchParams.set(snakeKey, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError;
    throw new MyriadApiError(response.status, error.message || `API error: ${response.status}`, error);
  }

  return response.json() as Promise<T>;
}

/**
 * Make a POST request to the Myriad API.
 */
async function apiPost<T>(baseUrl: string, path: string, body: unknown): Promise<T> {
  const url = new URL(path, baseUrl);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError;
    throw new MyriadApiError(response.status, error.message || `API error: ${response.status}`, error);
  }

  return response.json() as Promise<T>;
}

// =============================================================================
// Helpers
// =============================================================================

function toCamelCase(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map((v) => toCamelCase(v));
  } else if (obj !== null && typeof obj === "object" && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        (result as Record<string, unknown>)[camelKey] = toCamelCase(
          (obj as Record<string, unknown>)[key]
        );
        return result;
      },
      {} as Record<string, unknown>
    );
  }
  return obj;
}

// =============================================================================
// Markets API
// =============================================================================

/**
 * Fetch a paginated list of markets.
 *
 * @param baseUrl - API base URL (from network context)
 * @param params - Query parameters for filtering/sorting
 * @returns Paginated list of markets
 *
 * @example
 * ```ts
 * const markets = await getMarkets(apiBaseUrl, {
 *   state: "open",
 *   sort: "volume_24h",
 *   limit: 20,
 * });
 * ```
 */
export async function getMarkets(baseUrl: string, params: MarketsQueryParams = {}): Promise<MarketsResponse> {
  const response = await apiGet<MarketsResponse>(baseUrl, "/markets", {
    page: params.page ?? 1,
    limit: params.limit ?? DEFAULT_PAGE_SIZE,
    sort: params.sort ?? "volume",
    order: params.order ?? "desc",
    networkId: params.networkId,
    state: params.state,
    tokenAddress: params.tokenAddress,
    topics: params.topics,
    keyword: params.keyword,
  });

  return toCamelCase(response) as MarketsResponse;
}

/**
 * Fetch a single market by slug or ID.
 *
 * @param baseUrl - API base URL
 * @param slugOrId - Market slug (string) or market ID (number)
 * @param networkId - Required when using market ID
 * @returns Full market details including price charts
 *
 * @example
 * ```ts
 * // By slug
 * const market = await getMarket(apiBaseUrl, "will-eth-reach-5000");
 *
 * // By ID
 * const market = await getMarket(apiBaseUrl, 164, 2741);
 * ```
 */
export async function getMarket(
  baseUrl: string,
  slugOrId: string | number,
  networkId?: number
): Promise<MarketResponse> {
  const path = `/markets/${slugOrId}`;
  const params = typeof slugOrId === "number" && networkId ? { networkId } : undefined;
  const response = await apiGet<MarketResponse>(baseUrl, path, params);
  return toCamelCase(response) as MarketResponse;
}

// =============================================================================
// User/Portfolio API
// =============================================================================

/**
 * Fetch a user's portfolio (positions across markets).
 *
 * @param baseUrl - API base URL
 * @param address - User's wallet address
 * @param params - Query parameters for filtering
 * @returns Paginated list of positions
 *
 * @example
 * ```ts
 * const portfolio = await getUserPortfolio(apiBaseUrl, "0x123...", {
 *   networkId: 2741,
 * });
 * ```
 */
export async function getUserPortfolio(
  baseUrl: string,
  address: string,
  params: PortfolioQueryParams = {}
): Promise<PortfolioResponse> {
  const response = await apiGet<PortfolioResponse>(baseUrl, `/users/${address}/portfolio`, {
    page: params.page ?? 1,
    limit: params.limit ?? DEFAULT_PAGE_SIZE,
    networkId: params.networkId,
    marketId: params.marketId,
    marketSlug: params.marketSlug,
    tokenAddress: params.tokenAddress,
  });
  return toCamelCase(response) as PortfolioResponse;
}

/**
 * Fetch a user's trade events (activity history).
 *
 * @param baseUrl - API base URL
 * @param address - User's wallet address
 * @param params - Query parameters
 * @returns Paginated list of user events
 */
export async function getUserEvents(
  baseUrl: string,
  address: string,
  params: UserEventsQueryParams = {}
): Promise<UserEventsResponse> {
  const response = await apiGet<UserEventsResponse>(baseUrl, `/users/${address}/events`, {
    page: params.page ?? 1,
    limit: params.limit ?? DEFAULT_PAGE_SIZE,
    marketId: params.marketId,
    networkId: params.networkId,
    since: params.since,
    until: params.until,
  });
  return toCamelCase(response) as UserEventsResponse;
}

// =============================================================================
// Trading API
// =============================================================================

/**
 * Get a quote for a trade (buy or sell).
 *
 * The quote includes:
 * - Expected shares to receive/sell
 * - Price impact
 * - Fees
 * - Transaction calldata ready to submit
 *
 * @param baseUrl - API base URL
 * @param request - Quote request parameters
 * @returns Quote with calldata
 *
 * @example
 * ```ts
 * const quote = await getQuote(apiBaseUrl, {
 *   marketId: 164,
 *   networkId: 2741,
 *   outcomeId: 0,
 *   action: "buy",
 *   value: 100, // Buy with 100 tokens
 *   slippage: 0.01, // 1% slippage tolerance
 * });
 * ```
 */
export async function getQuote(baseUrl: string, request: QuoteRequest): Promise<Quote> {
  // Transform request to API format (snake_case)
  const body: Record<string, unknown> = {
    outcome_id: request.outcomeId,
    action: request.action,
    slippage: request.slippage ?? DEFAULT_SLIPPAGE,
  };

  // Add market identifier (slug or id+network)
  if (request.marketSlug) {
    body.market_slug = request.marketSlug;
  } else if (request.marketId !== undefined && request.networkId !== undefined) {
    body.market_id = request.marketId;
    body.network_id = request.networkId;
  }

  // Add value or shares
  if (request.value !== undefined) {
    body.value = request.value;
  }
  if (request.shares !== undefined) {
    body.shares = request.shares;
  }

  const response = await apiPost<Record<string, unknown>>(baseUrl, "/markets/quote", body);

  // Transform response to our format (camelCase)
  return {
    value: response.value as number,
    shares: response.shares as number,
    sharesThreshold: response.shares_threshold as number,
    priceAverage: response.price_average as number,
    priceBefore: response.price_before as number,
    priceAfter: response.price_after as number,
    calldata: response.calldata as string,
    netAmount: response.net_amount as number,
    fees: {
      treasury: (response.fees as Record<string, number>)?.treasury ?? 0,
      distributor: (response.fees as Record<string, number>)?.distributor ?? 0,
      fee: (response.fees as Record<string, number>)?.fee ?? 0,
    },
  };
}

/**
 * Get calldata for claiming winnings or voided shares.
 *
 * @param baseUrl - API base URL
 * @param request - Claim request parameters
 * @returns Claim action and calldata
 *
 * @example
 * ```ts
 * const claim = await getClaim(apiBaseUrl, {
 *   marketId: 164,
 *   networkId: 2741,
 * });
 * ```
 */
export async function getClaim(baseUrl: string, request: ClaimRequest): Promise<ClaimResponse> {
  const body: Record<string, unknown> = {};

  if (request.marketSlug) {
    body.market_slug = request.marketSlug;
  } else if (request.marketId !== undefined && request.networkId !== undefined) {
    body.market_id = request.marketId;
    body.network_id = request.networkId;
  }

  if (request.outcomeId !== undefined) {
    body.outcome_id = request.outcomeId;
  }

  const response = await apiPost<Record<string, unknown>>(baseUrl, "/markets/claim", body);

  return {
    action: response.action as ClaimResponse["action"],
    outcomeId: response.outcome_id as number,
    calldata: response.calldata as string,
  };
}

