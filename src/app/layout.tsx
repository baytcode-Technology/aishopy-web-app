import type { Metadata } from 'next'
import { AppProviders } from '@/providers/app-providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'AiShopy',
  description: 'Merchant dashboard for AiShopy. Manage your store in the browser.',
  icons: { icon: '/app_logo.jpg' },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
