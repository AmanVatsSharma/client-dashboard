import type { Metadata } from 'next'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vedpragya Bharat - Client Dashboard',
  description: 'Premium client dashboard for Vedpragya Bharat Private Limited',
  keywords: 'client dashboard, services, invoices, support',
  icons: {
    icon: [
      { url: '/logo_favicon.webp', type: 'image/webp' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    shortcut: ['/logo_favicon.webp'],
    apple: [
      { url: '/logo_favicon.webp', type: 'image/webp' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
