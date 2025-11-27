"use client";

import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { useAccount, useReadContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Wallet, Copy, LogOut, Github, Book, Check, ArrowUpRight, User, Moon } from "lucide-react";
import { TOKENS } from "@/lib/config";
import { toast } from "sonner";
import { erc20Abi, formatUnits } from "viem";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { abstractProfileQueryOptions } from "@/lib/queries";
import { truncateAddress } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import Link from "next/link";

interface ConnectWalletButtonProps {
  customDropdownItems?: React.ReactNode[];
  className?: string;
}

export function ConnectWalletButton({
  customDropdownItems,
  className,
}: ConnectWalletButtonProps) {
  const { login, logout } = useLoginWithAbstract();
  const { address, status, isConnecting, isReconnecting } = useAccount();
  const [hasCopied, setHasCopied] = useState(false);
  const { theme, setTheme } = useTheme();
  
  const { data: profile } = useQuery(abstractProfileQueryOptions(address));
  
  const { data: balanceData } = useReadContract({
    address: TOKENS.USDC.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000, 
    },
  });

  const formattedBalance = balanceData 
    ? formatUnits(balanceData, TOKENS.USDC.decimals) 
    : "0";

  const isLoading = status === "connecting" || status === "reconnecting" || isConnecting || isReconnecting;

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard");
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  if (status === "connected" && address) {
    const displayName = profile?.name || "User";

    return (
      <div className="flex items-center gap-4">
        <RainbowButton
          className="hidden sm:flex gap-2 h-9 group relative overflow-hidden pr-3"
          asChild
        >
          <a href="https://portal.abs.xyz/onramp" target="_blank" rel="noopener noreferrer">
            Deposit
            <ArrowUpRight className="h-4 w-4 ml-0.5 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
          </a>
        </RainbowButton>

        <div className="hidden sm:flex flex-col items-end mr-2">
          <span className="text-[10px] text-muted-foreground font-medium uppercase leading-none mb-1">
            USDC.e
          </span>
          <span className="text-sm font-bold leading-none">
            ${Number(formattedBalance).toFixed(2)}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 p-0 border border-border/50 focus-visible:ring-0 cursor-pointer">
              <Avatar className="h-9 w-9">
                {profile?.profilePictureUrl && (
                  <AvatarImage src={profile.profilePictureUrl} alt={displayName} />
                )}
                <AvatarImage src={`https://avatar.vercel.sh/${address}`} alt="Gradient fallback" />
                <AvatarFallback>
                  {address.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2">
            <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50 mb-2">
              <Avatar className="h-10 w-10">
                {profile?.profilePictureUrl && (
                  <AvatarImage src={profile.profilePictureUrl} alt={displayName} />
                )}
                <AvatarImage src={`https://avatar.vercel.sh/${address}`} alt="Gradient fallback" />
                <AvatarFallback>{address.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold truncate">{displayName}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {truncateAddress(address)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 ml-auto text-muted-foreground hover:text-foreground"
                onClick={handleCopyAddress}
              >
                {hasCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/portfolio">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild className="cursor-pointer">
              <a href="https://github.com/jarrodwatts/myriad-starter-kit" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                GitHub Repo
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <a href="https://help.myriad.markets/developer-docs" target="_blank" rel="noopener noreferrer">
                <Book className="mr-2 h-4 w-4" />
                Builder Docs
              </a>
            </DropdownMenuItem>

            {customDropdownItems && (
              <>
                <DropdownMenuSeparator />
                {customDropdownItems}
              </>
            )}

            <DropdownMenuSeparator />

            <div className="relative flex cursor-default select-none items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none">
               <div className="flex items-center gap-2">
                 <Moon className="mr-2 h-4 w-4 text-muted-foreground" />
                 <span className="font-normal">Dark mode</span>
               </div>
               <Switch
                 className="cursor-pointer"
                 checked={theme === "dark"}
                 onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
               />
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer font-medium">
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Button
      onClick={login}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </>
      )}
    </Button>
  );
}
