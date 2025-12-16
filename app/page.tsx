'use client'

import { useState, useEffect } from 'react'
import { 
  useAccount, 
  useConnect,
  useDisconnect,
  useReadContract, 
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient
} from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CONTRACT = '0xcf3Daf692ed603B1a08Ae50C6447D7e9E296Be0E'
const USDC = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8'

const USDC_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const

const ABI = [
  {
    "inputs": [],
    "name": "getMarketCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "markets",
    "outputs": [
      { "internalType": "uint256", "name": "targetBaseFee", "type": "uint256" },
      { "internalType": "uint256", "name": "expiry", "type": "uint256" },
      { "internalType": "uint256", "name": "totalLong", "type": "uint256" },
      { "internalType": "uint256", "name": "totalShort", "type": "uint256" },
      { "internalType": "bool", "name": "resolved", "type": "bool" },
      { "internalType": "bool", "name": "outcome", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "longBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "shortBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "marketId", "type": "uint256" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "betLong",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "marketId", "type": "uint256" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "betShort",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "targetBaseFeeWei", "type": "uint256" },
      { "internalType": "uint256", "name": "daysUntilExpiry", "type": "uint256" }
    ],
    "name": "createMarket",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "marketId", "type": "uint256" }],
    "name": "redeem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

export default function Home() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [showCreate, setShowCreate] = useState(false)
  const [targetGwei, setTargetGwei] = useState('0.5')
  const [days, setDays] = useState('7')
  const [betAmount, setBetAmount] = useState('10')
  const [markets, setMarkets] = useState<any[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const publicClient = usePublicClient()

  const { data: usdcRawBalance } = useReadContract({
    address: USDC,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined
  })
  const usdcBalance = usdcRawBalance ? Number(formatUnits(usdcRawBalance, 6)).toFixed(2) : '0.00'

  const { data: marketCount } = useReadContract({
    address: CONTRACT,
    abi: ABI,
    functionName: 'getMarketCount'
  })

  // Fetch markets
  useEffect(() => {
    if (!mounted || !marketCount || !publicClient) return

    const fetchMarkets = async () => {
      const newMarkets = []
      for (let i = 0; i < Number(marketCount); i++) {
        const m = await publicClient.readContract({
          address: CONTRACT,
          abi: ABI,
          functionName: 'markets',
          args: [BigInt(i)]
        }) as any

        if (m) {
          let userLong = 0n
          let userShort = 0n
          if (address) {
            userLong = await publicClient.readContract({
              address: CONTRACT,
              abi: ABI,
              functionName: 'longBalance',
              args: [BigInt(i), address]
            }) as bigint

            userShort = await publicClient.readContract({
              address: CONTRACT,
              abi: ABI,
              functionName: 'shortBalance',
              args: [BigInt(i), address]
            }) as bigint
          }

          newMarkets.push({ id: i, ...m, userLong, userShort })
        }
      }
      setMarkets(newMarkets)
    }

    fetchMarkets()
  }, [marketCount, address, mounted, publicClient, refreshKey])

  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: confirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (txSuccess) {
      setRefreshKey(prev => prev + 1)
      setShowCreate(false)
    }
  }, [txSuccess])

  const createMarket = () => {
    if (!targetGwei || Number(targetGwei) <= 0) {
      alert('Please enter a valid target gwei')
      return
    }
    const wei = parseUnits(Number(targetGwei).toFixed(6), 9)
    writeContract({ address: CONTRACT, abi: ABI, functionName: 'createMarket', args: [wei, BigInt(days)] })
  }

  const placeBet = (id: number, isLong: boolean) => {
    const amount = parseUnits(betAmount || '10', 6)
    writeContract({ address: CONTRACT, abi: ABI, functionName: isLong ? 'betLong' : 'betShort', args: [BigInt(id), amount] })
  }

  // Weekly predictive data (2025 mainnet pattern)
  const weeklyData = [
    { day: 'Mon', gwei: 0.12 },
    { day: 'Tue', gwei: 0.15 },
    { day: 'Wed', gwei: 0.18 },
    { day: 'Thu', gwei: 0.14 },
    { day: 'Fri', gwei: 0.13 },
    { day: 'Sat', gwei: 0.08 },
    { day: 'Sun', gwei: 0.06 }
  ]

  if (!mounted) return null

  const now = Date.now() / 1000

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden">
      <div className="overlay" />
      <div className="simple-header">Dark Forest Gas Futures</div>

      {/* Contract & USDC Notice */}
      <div className="card my-8 text-center text-sm">
        <p>
          <strong>Smart Contract:</strong>{' '}
          <a href="https://sepolia.etherscan.io/address/0xcf3Daf692ed603B1a08Ae50C6447D7e9E296Be0E" target="_blank" className="text-green-400 underline">
            0xcf3D...Be0E
          </a>
        </p>
        <p className="mt-2">
          <strong>Using official Circle Sepolia USDC</strong><br/>
          Token: <a href="https://sepolia.etherscan.io/address/0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8" target="_blank" className="text-green-400 underline">0x94a9...E4C8</a><br/>
          Get test USDC: <a href="https://gho.aave.com/faucet/" target="_blank" className="text-green-400 underline">Aave Sepolia Faucet</a>
        </p>
      </div>

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

        {/* Weekly Predictive Chart - Explicit pixel height */}
        <div className="card my-12">
          <h2 style={{textAlign:'center',color:'var(--accent)'}}>Weekly Average Base Fee (gwei)</h2>
          <p className="text-center text-sm opacity-80 mb-6">2025 mainnet pattern • Ultra-low fees</p>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="day" stroke="#00ff9d" />
                <YAxis stroke="#00ff9d" domain={[0, 0.2]} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #00ff9d' }} />
                <Bar dataKey="gwei" fill="#00ff9d" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="text-center my-12">
          <button onClick={() => setShowCreate(true)} className="text-4xl px-20 py-10 rounded-2xl">
            + CREATE MARKET
          </button>
          <button onClick={() => setRefreshKey(prev => prev + 1)} className="ml-8 px-8 py-4 text-lg rounded-xl bg-white/10">
            Refresh Markets
          </button>
        </div>

        {/* Markets list - Explicit min-height */}
        <div className="space-y-8 min-h-[600px]">
          {markets.length === 0 ? (
            <p className="text-center text-xl opacity-80">No active markets yet — create one!</p>
          ) : (
            markets
              .filter(m => Number(m.expiry) > now)
              .map(m => {
                const timeLeft = Number(m.expiry) - now
                const daysLeft = Math.floor(timeLeft / 86400)
                const hoursLeft = Math.floor((timeLeft % 86400) / 3600)
                const target = Number(m.targetBaseFee) / 1e9
                const userLong = Number(formatUnits(m.userLong || 0n, 6))
                const userShort = Number(formatUnits(m.userShort || 0n, 6))

                return (
                  <div key={m.id} className="market-row">
                    <div className="absolute top-2 left-2 bg-green-600 text-black px-3 py-1 rounded-full text-xs font-bold">OPEN</div>
                    {(userLong > 0 || userShort > 0) && <div className="your-badge">YOUR BET</div>}
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
              })
          )}
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
              <button onClick={createMarket} disabled={confirming} className="w-full py-8 text-4xl">
                {confirming ? 'Creating...' : 'CREATE MARKET'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
