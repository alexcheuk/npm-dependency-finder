import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'npm Version Finder - Resolve Package Vulnerabilities',
  description: 'Find the minimal parent npm package version that satisfies child package requirements. Resolve vulnerabilities with minimal changelog impact.',
  authors: [{ name: 'npm Version Finder' }],
  openGraph: {
    title: 'npm Version Finder - Resolve Package Vulnerabilities',
    description: 'Find the minimal parent npm package version that satisfies child package requirements. Resolve vulnerabilities with minimal changelog impact.',
    type: 'website',
    images: ['https://lovable.dev/opengraph-image-p98pqg.png'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@lovable_dev',
    images: ['https://lovable.dev/opengraph-image-p98pqg.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} ${jetbrainsMono.variable}`} suppressHydrationWarning>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}

import ClientProviders from './providers'