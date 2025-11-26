"use client";

/**
 * Market Filters Component
 *
 * Search and filter controls for the markets list.
 * Features:
 * - Keyword search
 * - Category tags (Crypto, Sports, etc.)
 * - Sort options (Trending, Popular, New)
 */

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Flame, Trophy, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketsQueryParams } from "@/lib/types";

// =============================================================================
// Constants
// =============================================================================

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "crypto", label: "Crypto" },
  { id: "sports", label: "Sports" },
  { id: "politics", label: "Politics" },
  { id: "economy", label: "Economy" },
  { id: "gaming", label: "Gaming" },
  { id: "culture", label: "Culture" },
  { id: "sentiment", label: "Sentiment" },
] as const;

const SORT_OPTIONS = [
  { id: "volume_24h", label: "Trending", icon: Flame },
  { id: "volume", label: "Popular", icon: Trophy },
  { id: "published_at", label: "New", icon: Clock },
] as const;

// =============================================================================
// Types
// =============================================================================

export interface MarketFiltersValue {
  keyword?: string;
  topics?: string;
  sort?: MarketsQueryParams["sort"];
  state?: "open" | "closed" | "resolved";
}

interface MarketFiltersProps {
  value: MarketFiltersValue;
  onChange: (value: MarketFiltersValue) => void;
}

// =============================================================================
// Component
// =============================================================================

export function MarketFilters({ value, onChange }: MarketFiltersProps) {
  // Remove local state for keyword input since it's moved to header

  const handleCategoryChange = useCallback(
    (category: string) => {
      onChange({
        ...value,
        topics: category === "all" ? undefined : category,
      });
    },
    [onChange, value]
  );

  const handleSortChange = useCallback(
    (newSort: string) => {
      onChange({ ...value, sort: newSort as MarketsQueryParams["sort"] });
    },
    [onChange, value]
  );

  const currentCategory = value.topics || "all";
  const currentSort = value.sort || "volume_24h";

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Categories */}
      <div className="w-full overflow-hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide mask-fade-right no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none]">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={cn(
                "flex h-8 lg:h-9 items-center justify-center rounded-full px-3 lg:px-4 text-xs lg:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0",
                currentCategory.toLowerCase() === category.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center justify-between sm:justify-end gap-4">
        <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg border border-border/40 w-full sm:w-auto overflow-x-auto">
          {SORT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = currentSort === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleSortChange(option.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-initial whitespace-nowrap",
                  isActive
                    ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


