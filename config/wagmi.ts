import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
    walletConnect({ projectId: 'YOUR_WC_PROJECT_ID' }) // optional - leave placeholder, works without real ID for MetaMask
  ],
  transports: {
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com')
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
