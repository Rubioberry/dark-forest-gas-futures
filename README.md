# Myriad Starter Kit

A developer-friendly starter kit for building prediction market applications on [Myriad Protocol](https://myriadprotocol.com) and [Abstract](https://abs.xyz).

## Features

- **Market Browsing** - Search, filter, and explore prediction markets
- **Market Details** - View outcomes, price charts, and trading history
- **Trading** - Buy and sell outcome shares with real-time quotes
- **Portfolio** - Track positions, P&L, and claim winnings
- **Wallet Support** - Abstract Global Wallet (AGW) + standard wallets via RainbowKit
- **Abstract Mainnet** - Production-ready on Abstract

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Wallet**: RainbowKit + wagmi + viem
- **Data**: TanStack Query + Myriad REST API
- **Smart Contracts**: polkamarkets-js SDK

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-org/myriad-starter-kit.git
cd myriad-starter-kit
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_MYRIAD_API_KEY` | Myriad API key ([contact Myriad](https://myriadprotocol.com)) | Yes |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID | Recommended |
| `NEXT_PUBLIC_REFERRAL_CODE` | Your referral code for revenue sharing | Optional |

### 4. Start development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js App                              │
├─────────────────────────────────────────────────────────────────┤
│  Pages                                                          │
│  ├── / (Markets listing)                                        │
│  ├── /markets/[slug] (Market detail + trading)                  │
│  └── /portfolio (User positions)                                │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                      │
│  ├── TanStack Query (caching, loading states)                   │
│  ├── Myriad REST API (market data, quotes)                      │
│  └── polkamarkets-js SDK (on-chain transactions)                │
├─────────────────────────────────────────────────────────────────┤
│  Wallet Layer                                                    │
│  ├── RainbowKit (connection UI)                                 │
│  ├── wagmi (React hooks)                                        │
│  └── AGW Connector (Abstract Global Wallet)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
lib/
  config.ts           # Network config, contract addresses
  wagmi.ts            # Wallet configuration
  myriad-api.ts       # REST API client
  myriad-sdk.ts       # polkamarkets-js wrapper
  network-context.tsx # Network configuration provider
  queries/            # TanStack Query options
  mutations/          # Trade/claim mutations
  types/              # TypeScript interfaces

components/
  layout/             # Header, navigation
  markets/            # Market list, cards, filters
  market/             # Detail page components
  portfolio/          # Position cards, summary
  ui/                 # shadcn primitives

app/
  page.tsx            # Markets listing
  markets/[slug]/     # Market detail
  portfolio/          # User portfolio
```

## Customization Guide

### Theming

The starter kit uses shadcn/ui with a neutral theme. Customize in:

- `app/globals.css` - CSS variables for colors, radius, etc.
- `app/providers.tsx` - RainbowKit theme configuration

### Adding Networks

To add support for other Myriad-supported chains (Linea, BNB Chain):

1. Add chain config to `lib/config.ts`
2. Add chain to `lib/wagmi.ts`
3. Update network context to include new chains

### Custom Components

All components follow a consistent pattern:
- Located in `components/` directory
- TypeScript interfaces for props
- JSDoc comments explaining usage

## Key Files Explained

### `lib/config.ts`
Central configuration file with:
- Network settings (RPC URL, chain ID)
- Contract addresses
- Token addresses (USDC, PENGU, PTS)
- API endpoint

### `lib/myriad-api.ts`
Typed REST API client with functions for:
- `getMarkets()` - List markets with filters
- `getMarket()` - Single market with price charts
- `getQuote()` - Trade quotes with calldata
- `getUserPortfolio()` - User positions

### `lib/queries/`
TanStack Query options factories using the `queryOptions` pattern:
- Type-safe query keys
- Automatic caching configuration
- Easy to compose and extend

### `lib/mutations/`
TanStack Query mutations for transactions:
- `useTrade()` - Buy/sell with approval flow
- `useClaim()` - Claim winnings

## API Reference

The starter kit uses the Myriad Protocol REST API v2:

- **Base URL**: `https://api-v2.myriadprotocol.com`

Key endpoints used:
- `GET /markets` - List markets
- `GET /markets/:slug` - Market details
- `POST /markets/quote` - Trade quotes
- `GET /users/:address/portfolio` - User positions

[Full API Documentation](https://docs.myriadprotocol.com)

## Revenue Sharing

Builders can earn a percentage of buy volume through Myriad's referral program:

1. **Apply for whitelisting** - Contact Myriad team
2. **Get your referral code** - Short ASCII string
3. **Configure the starter kit** - Set `NEXT_PUBLIC_REFERRAL_CODE`

When configured, all buy transactions automatically use `referralBuy` to attribute trades to your code.

Eligible trades: Markets with `distributor_fee > 0`

## Smart Contracts

### Abstract Mainnet

| Contract | Address |
|----------|---------|
| PredictionMarket | `0x3e0F5F8F5Fb043aBFA475C0308417Bf72c463289` |
| PredictionMarketQuerier | `0x1d5773Cd0dC74744C1F7a19afEeECfFE64f233Ff` |

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see LICENSE file for details.

## Resources

- [Myriad Protocol](https://myriadprotocol.com)
- [Abstract](https://abs.xyz)
- [Myriad API Docs](https://docs.myriadprotocol.com)
- [polkamarkets-js](https://github.com/polkamarkets/polkamarkets-js)
