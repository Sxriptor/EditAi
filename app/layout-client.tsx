'use client'

import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { SubscriptionManager } from '@/components/SubscriptionManager'
import { PaymentStatus } from './payment-status'

const inter = Inter({ subsets: ['latin'] })

export function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <AuthProvider>
        <SubscriptionManager>
          <PaymentStatus />
          {children}
          <Toaster />
        </SubscriptionManager>
      </AuthProvider>
    </ThemeProvider>
  )
} 