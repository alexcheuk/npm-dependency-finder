import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { StructuredData } from "@/components/StructuredData";
import { GoogleAnalytics } from "@/components/analytics";
import { PageViewTracker } from "@/components/PageViewTracker";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "npm Version Finder - Resolve Package Vulnerabilities",
    template: "%s | npm Version Finder",
  },
  description:
    "Find the minimal parent npm package version that satisfies child package requirements. Resolve vulnerabilities with minimal changelog impact. Free developer tool for npm dependency management.",
  keywords: [
    "npm",
    "package manager",
    "dependency",
    "vulnerability",
    "security",
    "version finder",
    "node.js",
    "javascript",
    "developer tools",
  ],
  authors: [
    { name: "npm Version Finder", url: "https://npm-version-finder.dev" },
  ],
  creator: "npm Version Finder",
  publisher: "npm Version Finder",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://npm-version-finder.dev",
    title: "npm Version Finder - Resolve Package Vulnerabilities",
    description:
      "Find the minimal parent npm package version that satisfies child package requirements. Resolve vulnerabilities with minimal changelog impact.",
    siteName: "npm Version Finder",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "npm Version Finder - Resolve Package Vulnerabilities",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "npm Version Finder - Resolve Package Vulnerabilities",
    description:
      "Find the minimal parent npm package version that satisfies child package requirements. Free developer tool.",
    images: ["/og-image.png"],
    creator: "@npmversionfinder",
  },
  verification: {
    google: "your-google-verification-code",
  },
  alternates: {
    canonical: "https://npm-version-finder.dev",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://api.npmjs.org" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0"
        />
        <meta
          name="theme-color"
          content="#000000"
          media="(prefers-color-scheme: dark)"
        />
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta name="format-detection" content="telephone=no" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${inter.className} ${jetbrainsMono.variable}`}
        suppressHydrationWarning
      >
        <GoogleAnalytics />
        <StructuredData />
        <ClientProviders>
          <PageViewTracker />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

import ClientProviders from "./providers";
