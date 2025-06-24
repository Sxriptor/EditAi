'use client'

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SubscriptionManager } from "@/components/SubscriptionManager"
import { PaymentStatus } from "./payment-status"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AMENTA AI - Editing Agent",
  description:
    "AI-native photo and video editing platform. Transform your visual media using natural language prompts and advanced LUT-based grading.",
  icons: {
    icon: "/faviconcolor.png"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
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
      </body>
    </html>
  )
}
