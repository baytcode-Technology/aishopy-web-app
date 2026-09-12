import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AiShopy',
  description: 'Merchant dashboard for AiShopy. Manage your store in the browser.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
