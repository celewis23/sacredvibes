'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { subscribersApi } from '@/lib/api'

type Status = 'loading' | 'done' | 'error'

function UnsubscribeInner() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!id) {
      setStatus('error')
      return
    }

    subscribersApi.unsubscribe(id)
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'))
  }, [id])

  return (
    <main className="min-h-[70vh] flex items-center justify-center section">
      <div className="container-sacred max-w-md text-center">
        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-4 border-sacred-200 border-t-sacred-700 rounded-full animate-spin mx-auto mb-6" />
            <p className="text-sacred-500 text-sm">Processing your request...</p>
          </>
        )}

        {status === 'done' && (
          <>
            <h1 className="font-heading text-3xl text-sacred-900 mb-3">You&apos;ve been unsubscribed</h1>
            <p className="text-sacred-600 mb-8">
              You won&apos;t receive any more emails from Sacred Vibes Yoga. If this was a mistake, or you&apos;d like
              to hear from us again in the future, just reach out.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-sacred-800 text-white rounded-full text-sm hover:bg-sacred-900 transition-colors"
            >
              Return to Sacred Vibes Yoga
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="font-heading text-3xl text-sacred-900 mb-3">Something went wrong</h1>
            <p className="text-sacred-600 mb-8">
              We couldn&apos;t process this unsubscribe link. If you&apos;d still like to be removed from our list,
              please contact us directly.
            </p>
            <Link
              href="/contact"
              className="inline-block px-6 py-2.5 bg-sacred-800 text-white rounded-full text-sm hover:bg-sacred-900 transition-colors"
            >
              Contact Us
            </Link>
          </>
        )}
      </div>
    </main>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sacred-200 border-t-sacred-700 rounded-full animate-spin" />
      </div>
    }>
      <UnsubscribeInner />
    </Suspense>
  )
}
