'use client'

import { useGoogleAnalytics } from '@/lib/analytics'

export function PageViewTracker() {
  useGoogleAnalytics()
  return null
}
