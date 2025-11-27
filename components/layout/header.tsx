"use client";

/**
 * Header Component
 *
 * Main navigation header with:
 * - Logo/brand
 * - Navigation links
 * - Wallet connection button
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Suspense, useState, useEffect } from "react";
import { ConnectWalletButton } from "@/components/connect-wallet-button";

// =============================================================================
// Navigation Links
// =============================================================================

function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  // Sync local state with URL params
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSearch = (value: string) => {
    setQuery(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    router.replace(`/?${params.toString()}`);
  };

  return (
    <div className="relative w-full max-w-md hidden sm:block">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search markets..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="h-9 pl-9 bg-muted/50 border-transparent focus:bg-background focus:border-input transition-all"
      />
    </div>
  );
}

// =============================================================================
// Header Component
// =============================================================================

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/5 backdrop-blur-xl supports-[backdrop-filter]:bg-background/5">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo and Nav */}
        <div className="flex items-center gap-8 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            {/* CUSTOMIZE: Replace with your logo */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <span className="text-sm font-bold">M</span>
            </div>
            <span className="text-lg font-semibold tracking-tight hidden sm:inline-block">Myriad</span>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 flex justify-center">
          <Suspense fallback={<div className="w-full max-w-md h-9 bg-muted/50 rounded-md animate-pulse hidden sm:block" />}>
            <SearchBar />
          </Suspense>
        </div>

        {/* Right side: Wallet */}
        <div className="flex items-center gap-3 shrink-0">
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}

