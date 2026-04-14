'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { leadsApi } from '@/lib/api'
import LotusMark from '@/components/branding/LotusMark'

const schema = z.object({
  email:     z.string().email('Please enter a valid email'),
  firstName: z.string().optional(),
  honeypot:  z.string().max(0, 'Bot detected').optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  brandId: string
  colorScheme?: 'yoga' | 'hands' | 'sound'
}

export default function NewsletterSection({ brandId, colorScheme = 'yoga' }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    if (values.honeypot) return
    try {
      await leadsApi.submitLead({
        brandId,
        type: 'NewsletterSignup',
        email: values.email,
        firstName: values.firstName,
        newsletterOptIn: true,
        honeypotField: values.honeypot,
      })
      setSubmitted(true)
      toast.success('Welcome to the sacred community.')
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <section data-header="dark" className="relative py-28 overflow-hidden"
             style={{ background: 'linear-gradient(135deg, #1c1714 0%, #2d2420 50%, #1c1714 100%)' }}>
      {/* Ambient glow */}
      <div className="orb w-[600px] h-[600px] bg-yoga-600"
           style={{ top: '-200px', left: '50%', transform: 'translateX(-50%)', opacity: 0.07 }} />

      <div className="container-sacred relative z-10">
        <div className="max-w-2xl mx-auto text-center">

          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-yoga-700/30 border border-yoga-500/30 flex items-center justify-center text-2xl mx-auto mb-8 animate-float">
            <LotusMark className="w-8" />
          </div>

          <p className="eyebrow text-yoga-400 mb-5">Join the Community</p>
          <h2 className="font-heading text-display-md md:text-display-lg text-white leading-tight mb-4 text-balance">
            Receive Your Free Healing Gift
          </h2>
          <p className="text-sacred-400/70 mb-3 font-body font-light tracking-wide leading-relaxed">
            Subscribe and receive a free guided sound healing meditation — your first step into the sanctuary.
          </p>
          <p className="text-sacred-500/50 text-sm font-body mb-10">
            Plus weekly wisdom, event announcements, and sacred offers.
          </p>

          {submitted ? (
            <div className="p-10 rounded-3xl bg-yoga-900/40 border border-yoga-600/30">
              <div className="text-4xl mb-4">✦</div>
              <p className="font-heading text-3xl text-white mb-3">Welcome, beloved.</p>
              <p className="text-yoga-300/70 text-sm font-body tracking-wide">
                Your free meditation is on its way. Check your inbox.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              {/* Honeypot */}
              <input {...register('honeypot')} type="text" tabIndex={-1} aria-hidden className="hidden" />

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  {...register('firstName')}
                  type="text"
                  placeholder="First name (optional)"
                  className="flex-1 px-5 py-4 rounded-full bg-white/8 border border-white/15 text-white placeholder:text-sacred-500/60 focus:outline-none focus:ring-1 focus:ring-yoga-500 focus:border-yoga-500 text-sm font-body tracking-wide transition-all duration-200"
                />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 px-5 py-4 rounded-full bg-white/8 border border-white/15 text-white placeholder:text-sacred-500/60 focus:outline-none focus:ring-1 focus:ring-yoga-500 focus:border-yoga-500 text-sm font-body tracking-wide transition-all duration-200"
                />
              </div>

              {errors.email && (
                <p className="text-red-400/80 text-xs font-body text-center">{errors.email.message}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-gold justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Receive Your Free Meditation'}
              </button>
            </form>
          )}

          <p className="text-sacred-600/50 text-xs mt-5 font-body tracking-wide">
            Sacred privacy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  )
}
