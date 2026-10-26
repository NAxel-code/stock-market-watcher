import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Providers } from '@/components/providers'
import { Navbar } from '@/components/layout/Navbar'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'StockPulse — Real-Time Equity & Quant Intelligence Terminal',
  description: 'Institutional-grade real-time market telemetry, Almgren-Chriss execution simulator, and RMT portfolio analytics for US & Indonesian (IDX) equities.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased bg-[#07080A] text-[#F0F4F8] selection:bg-[#00E599]/20 selection:text-[#00E599]`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
