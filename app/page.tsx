'use client'

import { useState, useEffect } from 'react'
import { 
  useAccount, 
  useConnect,
  useDisconnect,
  useReadContract, 
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const CONTRACT = '0x7aB017737801C536De8f3914b8BcB62B4B3c2ac0'
const USDC = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8'

const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)"
] as const

const ABI = [
  "function getMarketCount() view returns (uint256)",
  "function markets(uint256) view returns (uint256 targetBaseFee, uint256 expiry, uint256 totalLong, uint256 totalShort, bool resolved, bool outcome)",
  "function longBalance(uint256,address) view returns (uint256)",
  "function shortBalance(uint256,address) view returns (uint256)",
  "function betLong(uint256 marketId, uint256 amount)",
  "function betShort(uint256 marketId, uint256 amount)",
  "function createMarket(uint256 targetBaseFeeWei, uint256 daysUntilExpiry)",
  "function redeem(uint256 marketId)"
] as const

export default function Home() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [showCreate, setShowCreate] = useState(false)
  const [targetGwei, setTargetGwei] = useState('0.5')
  const [days, setDays] = useState('7')
  const [betAmount, setBetAmount] = useState('10')
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const { data: usdcRawBalance } = useReadContract({
    address: USDC,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    watch: true
  })
  const usdcBalance = usdcRawBalance ? Number(formatUnits(usdcRawBalance, 6)).toFixed(2) : '0.00'

  const { data: marketCount } = useReadContract({ address: CONTRACT, abi: ABI, functionName: 'getMarketCount' })

  const markets: any[] = []
  if (mounted && marketCount) {
    for (let i = 0; i < Number(marketCount); i++) {
      const { data: m } = useReadContract({ address: CONTRACT, abi: ABI, functionName: 'markets', args: [BigInt(i)] })
      if (m) {
        const { data: longBal } = useReadContract({ address: CONTRACT, abi: ABI, functionName: 'longBalance', args: [BigInt(i), address || '0x0'] })
        const { data: shortBal } = useReadContract({ address: CONTRACT, abi: ABI, functionName: 'shortBalance', args: [BigInt(i), address || '0x0'] })
        markets.push({ id: i, ...m, userLong: longBal || 0n, userShort: shortBal || 0n })
      }
    }
  }

  const { writeContract } = useWriteContract()

  const createMarket = () => {
    const wei = parseUnits((Number(targetGwei) || 1).toFixed(6), 9)
    writeContract({ address: CONTRACT, abi: ABI, functionName: 'createMarket', args: [wei, BigInt(days)] })
  }

  const placeBet = (id: number, isLong: boolean) => {
    const amount = parseUnits(betAmount || '10', 6)
    writeContract({ address: CONTRACT, abi: ABI, functionName: isLong ? 'betLong' : 'betShort', args: [BigInt(id), amount] })
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="overlay" />
      <header className="border-b border-white/10">
        <div className="container mx-auto px-6 py-8 flex justify-between items-center">
          <h1 className="text-4xl font-bold text-green-400">Dark Forest Gas Futures</h1>
          <div className="text-right">
            {!isConnected ? (
              <Button onClick={() => connectors[0] && connect({ connector: connectors[0] })}>
                Connect Wallet
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm opacity-80">Wallet Connected</p>
                <p className="font-mono">{address?.slice(0,8)}...{address?.slice(-6)}</p>
                <p className="text-lg font-bold">${usdcBalance} USDC</p>
                <Button variant="destructive" onClick={() => disconnect()}>
                  Disconnect
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <Button size="lg" onClick={() => setShowCreate(true)}>
            + Create Market
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {markets
            .filter(m => Date.now()/1000 < Number(m.expiry))
            .map(m => {
              const timeLeft = Number(m.expiry) - Date.now()/1000
              const daysLeft = Math.floor(timeLeft / 86400)
              const hoursLeft = Math.floor((timeLeft % 86400) / 3600)
              const target = Number(m.targetBaseFee) / 1e9
              const userLong = Number(formatUnits(m.userLong || 0n, 6))
              const userShort = Number(formatUnits(m.userShort || 0n, 6))

              return (
                <Card key={m.id} className="border-green-400/50 bg-white/5">
                  <CardHeader>
                    <CardTitle>Market #{m.id}</CardTitle>
                    <CardDescription>Target: {target.toFixed(4)} gwei</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>Time left: {daysLeft}d {hoursLeft}h</p>
                    {(userLong > 0 || userShort > 0) && (
                      <p className="text-sm">
                        Your position: {userLong > 0 ? `LONG $${userLong}` : `SHORT $${userShort}`}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <Button onClick={() => placeBet(m.id, true)}>LONG</Button>
                      <Button variant="destructive" onClick={() => placeBet(m.id, false)}>SHORT</Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      </main>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-gray-900 text-white border-green-400/50">
          <DialogHeader>
            <DialogTitle>Create Market</DialogTitle>
            <DialogDescription>
              Set the target base fee and expiry for a new market
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="target">Target Base Fee (gwei)</Label>
              <Input id="target" type="number" placeholder="0.5" step="0.001" value={targetGwei} onChange={e => setTargetGwei(e.target.value)} className="bg-white/10 border-white/20 text-white" />
            </div>
            <div>
              <Label htmlFor="days">Days until expiry</Label>
              <Input id="days" type="number" value={days} onChange={e => setDays(e.target.value)} className="bg-white/10 border-white/20 text-white" />
            </div>
            <Button onClick={createMarket} className="w-full">
              Create Market
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
