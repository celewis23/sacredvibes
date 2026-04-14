import { headers } from 'next/headers'
import Link from 'next/link'
import { getCurrentBrand } from '@/lib/brand/current'
import { toBrandPath } from '@/lib/brand/resolution'

export default async function BookingConfirmationPage() {
  const headersList = await headers()
  const brand = getCurrentBrand(headersList)

  return (
    <main className="section">
      <div className="container-sacred">
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="font-heading text-4xl text-sacred-900 mb-4">Booking Confirmed</h1>
          <p className="text-sacred-600 leading-relaxed mb-8">
            Thank you for booking with us. We&apos;ve received your request and will be in touch shortly
            to confirm your session details.
          </p>

          <div className="bg-sacred-50 rounded-2xl p-6 text-left mb-8 space-y-2 text-sm text-sacred-700">
            <p className="font-medium text-sacred-900 mb-3">What happens next?</p>
            <div className="flex gap-3">
              <span className="text-sacred-400 shrink-0">1.</span>
              <span>You&apos;ll receive a confirmation email with your booking details.</span>
            </div>
            <div className="flex gap-3">
              <span className="text-sacred-400 shrink-0">2.</span>
              <span>We&apos;ll reach out within 24 hours to confirm your appointment time.</span>
            </div>
            <div className="flex gap-3">
              <span className="text-sacred-400 shrink-0">3.</span>
              <span>Please arrive 10 minutes early for your first session.</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={toBrandPath(brand, '/')}
              className="px-6 py-2.5 bg-sacred-800 text-white rounded-full text-sm hover:bg-sacred-900 transition-colors"
            >
              Return Home
            </Link>
            <Link
              href={toBrandPath(brand, '/contact')}
              className="px-6 py-2.5 border border-sacred-200 text-sacred-700 rounded-full text-sm hover:bg-sacred-50 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
