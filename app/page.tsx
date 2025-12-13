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

  // Fixed USDC balance using direct contract read (wagmi v2 way)
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
    <div className="min-h-screen text-white relative overflow-x-hidden">
      <div className="overlay" />
      <div className="simple-header">Dark Forest Gas Futures</div>

      <div className="container">

        <div className="card">
          <h2 style={{textAlign:'center',color:'var(--accent)',marginBottom:'16px'}}>Current Base Fee</h2>
          <div className="value">0.423 gwei</div>

          {!isConnected ? (
            <button onClick={() => connectors[0] && connect({ connector: connectors[0] })} className="w-full mt-8">
              CONNECT WALLET
            </button>
          ) : (
            <>
              <div style={{textAlign:'center',marginTop:'12px'}}>Wallet: {address?.slice(0,6)}…{address?.slice(-4)}</div>
              <div className="text-center text-2xl mt-4">
                Balance: ${usdcBalance} USDC
              </div>
              <button onClick={() => disconnect()} className="w-full mt-8 red">
                DISCONNECT
              </button>
            </>
          )}
        </div>

        <div className="text-center my-12">
          <button onClick={() => setShowCreate(true)} className="text-4xl px-20 py-10 rounded-2xl">
            + CREATE MARKET
          </button>
        </div>

        <div className="space-y-8">
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
                <div key={m.id} className="market-row">
                  {(userLong > 0 || userShort > 0) && <div className="your-badge">YOU BET</div>}
                  <div>
                    <strong>Market #{m.id}</strong><br/>
                    Target: {target.toFixed(4)} gwei<br/>
                    Time left: {daysLeft}d {hoursLeft}h
                    {(userLong > 0 || userShort > 0) && <><br/><small>You: {userLong > 0 ? `LONG $${userLong}` : `SHORT $${userShort}`}</small></>}
                  </div>
                  <div className="market-buttons">
                    <button onClick={() => placeBet(m.id, true)}>LONG</button>
                    <button className="red" onClick={() => placeBet(m.id, false)}>SHORT</button>
                  </div>
                </div>
              )
            })}
        </div>

        {showCreate && (
          <div className="modal active">
            <div className="modal-content">
              <span style={{position:'absolute',top:'10px',right:'16px',fontSize:'32px',color:'#666',cursor:'pointer'}} onClick={() => setShowCreate(false)}>×</span>
              <h3 style={{color:'var(--accent)',textAlign:'center'}}>CREATE MARKET</h3>
              <p style={{textAlign:'center'}}>Target Base Fee (gwei)</p>
              <input type="number" placeholder="0.5" step="0.001" value={targetGwei} onChange={e => setTargetGwei(e.target.value)} className="w-full mb-6" />
              <p style={{textAlign:'center',marginTop:'20px'}}>Days until expiry</p>
              <input type="number" value={days} onChange={e => setDays(e.target.value)} className="w-full mb-12" />
              <button onClick={createMarket} className="w-full py-8 text-4xl">
                CREATE MARKET
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
