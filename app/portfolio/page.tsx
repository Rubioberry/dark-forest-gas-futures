"use client";

/**
 * Portfolio Page
 *
 * Displays the connected user's positions across all markets.
 * Includes:
 * - Portfolio summary (total value, P&L)
 * - List of positions with claim functionality
 * - Connect wallet prompt when not connected
 */

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { ConnectWalletButton } from "@/components/connect-wallet-button";
import { useNetwork } from "@/lib/network-context";
import { portfolioQueryOptions, abstractProfileQueryOptions } from "@/lib/queries";
import { PositionsTable } from "@/components/portfolio/positions-table";
import { ActivityFeed } from "@/components/portfolio/activity-feed";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, LayoutList, Activity as ActivityIcon, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Position } from "@/lib/types";

// =============================================================================
// Loading Skeleton
// =============================================================================

function PortfolioSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center gap-6 p-6 border rounded-xl">
         <Skeleton className="h-20 w-20 rounded-full" />
         <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
         </div>
      </div>

      {/* Summary Skeleton */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
           <Skeleton className="h-10 w-48" />
           <Skeleton className="h-[400px] rounded-xl" />
        </div>
        <div className="space-y-4">
           <Skeleton className="h-10 w-32" />
           <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Connect Wallet Prompt
// =============================================================================

function ConnectWalletPrompt() {
  return (
    <Card className="mx-auto max-w-md mt-12">
      <CardContent className="flex flex-col items-center p-8 text-center">
        <div className="rounded-full bg-muted p-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold">Connect Your Wallet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect your wallet to view your portfolio and positions.
        </p>
        <div className="mt-6">
          <ConnectWalletButton />
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyPortfolio() {
  return (
    <div className="flex flex-col items-center justify-center p-12 border rounded-xl border-dashed text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
         <LayoutList className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold">No Positions Yet</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
        You don&apos;t have any positions. Start trading on prediction markets to build your
        portfolio.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Browse Markets</Link>
      </Button>
    </div>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// =============================================================================
// Profile Header
// =============================================================================

function ProfileHeader({ address, positions }: { address: string; positions: Position[] }) {
  const { data: profile, isLoading } = useQuery(abstractProfileQueryOptions(address));
  const totalProfit = positions.reduce((sum, p) => sum + p.profit, 0);

  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
        
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-primary to-purple-500 rounded-full opacity-20 blur" />
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-background relative shadow-xl">
            {profile?.profilePictureUrl && (
              <AvatarImage src={profile.profilePictureUrl} alt={profile.name} className="object-cover" />
            )}
            <AvatarImage src={`https://avatar.vercel.sh/${address}`} alt="Gradient fallback" />
            <AvatarFallback><User className="h-10 w-10" /></AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row items-center sm:justify-between gap-4 relative z-10">
           <div className="flex items-center gap-3">
             <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
               {profile?.name || "Abstract User"}
             </h1>
           </div>
           
           {/* Total P&L */}
           <div className="flex flex-col items-end justify-center pl-6 border-l border-border/50 my-1">
             <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total P&L</span>
                <TrendingUp className={cn(
                  "h-3 w-3", 
                  totalProfit >= 0 ? "text-emerald-500" : "text-rose-500 rotate-180"
                )} />
             </div>
             <p className={cn(
               "text-2xl sm:text-3xl font-bold tabular-nums tracking-tight",
               totalProfit >= 0 ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]" : "text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.2)]"
             )}>
               {totalProfit >= 0 ? "+" : ""}
               {formatCurrency(totalProfit)}
             </p>
           </div>
        </div>
    </div>
  );
}

// =============================================================================
// Page Component
// =============================================================================

export default function PortfolioPage() {
  const { status, address } = useAccount();
  const isConnected = status === "connected";
  const { apiBaseUrl, networkConfig } = useNetwork();
  const [activeTab, setActiveTab] = useState<"positions" | "activity">("positions");

  // Fetch portfolio data
  const { data, isPending, error } = useQuery({
    ...portfolioQueryOptions(apiBaseUrl, address ?? "", {
      networkId: networkConfig.id,
    }),
    enabled: Boolean(address),
  });

  // Not connected
  if (!isConnected) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
         <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="mt-2 text-muted-foreground">
            Track your positions and claim winnings.
          </p>
        </div>
        <ConnectWalletPrompt />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 min-h-screen">
      {/* Loading State */}
      {isPending && <PortfolioSkeleton />}

      {/* Error State */}
      {error && (
        <Card className="mt-8 border-destructive/50">
          <CardContent className="p-6 text-center">
            <p className="text-destructive font-medium">Failed to load portfolio data. Please try again later.</p>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Content */}
      {data && address && (
        <div className="space-y-8">
          
          {/* 1. Profile Header with P&L */}
          <ProfileHeader address={address} positions={data.data} />

          {/* 2. Main Content - Tabs */}
          <Tabs defaultValue="positions" className="w-full rounded-xl border border-border/50 bg-card overflow-hidden gap-0">
             <div className="border-b border-border/50 bg-muted/30 px-4 py-3 flex items-center">
               <TabsList className="bg-muted/50 h-9 p-1">
                 <TabsTrigger value="positions" className="gap-2 px-3 text-xs font-medium">
                   <LayoutList className="h-3.5 w-3.5" />
                   Positions
                   <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full leading-none">
                     {data.data.length}
                   </span>
                 </TabsTrigger>
                 <TabsTrigger value="activity" className="gap-2 px-3 text-xs font-medium">
                   <ActivityIcon className="h-3.5 w-3.5" />
                   Activity
                 </TabsTrigger>
               </TabsList>
             </div>

             <TabsContent value="positions" className="m-0 outline-none">
                {data.data.length === 0 ? (
                  <div className="p-6 sm:p-12">
                    <EmptyPortfolio />
                  </div>
                ) : (
                  <PositionsTable positions={data.data} className="border-0 rounded-none" />
                )}
             </TabsContent>

             <TabsContent value="activity" className="m-0 outline-none">
                <ActivityFeed className="border-0 rounded-none" />
             </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}