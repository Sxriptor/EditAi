import { Inter } from 'next/font/google'
import './globals.css'
import { Metadata } from 'next'
import { ClientLayout } from './layout-client'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "AMENTA AI - Editing Agent",
  description:
    "AI-native photo and video editing platform. Transform your visual media using natural language prompts and advanced LUT-based grading.",
  icons: {
    icon: "/faviconcolor.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
