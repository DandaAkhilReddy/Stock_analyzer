'use client'

import { Suspense } from 'react'
import WaitlistContent from './WaitlistContent'

// Force dynamic rendering to avoid build-time Firebase initialization
export const dynamic = 'force-dynamic'

export default function WaitlistPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <div className="text-2xl gradient-text">Loading...</div>
      </div>
    }>
      <WaitlistContent />
    </Suspense>
  )
}
