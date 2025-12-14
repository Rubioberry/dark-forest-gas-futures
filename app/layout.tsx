import type { Metadata } from 'next'
import Providers from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dark Forest Gas Futures',
  description: 'Predict Ethereum gas prices. Win USDC.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
