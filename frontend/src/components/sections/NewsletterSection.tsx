'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { leadsApi } from '@/lib/api'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  firstName: z.string().optional(),
  honeypot: z.string().max(0, 'Bot detected').optional(),
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
    if (values.honeypot) return // bot
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
      toast.success('You\'re on the list! Welcome.')
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <section className="section bg-sacred-900">
      <div className="container-sacred">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-yoga-400 mb-3">Stay Connected</p>
          <h2 className="font-heading text-3xl md:text-4xl text-white mb-4">
            Join the Sacred Vibes Community
          </h2>
          <p className="text-sacred-400 mb-8 leading-relaxed">
            Get updates on classes, workshops, special events, and wellness wisdom delivered to your inbox.
          </p>

          {submitted ? (
            <div className="bg-yoga-900/50 border border-yoga-700 rounded-2xl p-8 text-yoga-200">
              <p className="font-heading text-2xl text-white mb-2">Thank you for joining!</p>
              <p className="text-yoga-300 text-sm">You&apos;ll receive a welcome email shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
              {/* Honeypot */}
              <input {...register('honeypot')} type="text" tabIndex={-1} aria-hidden className="hidden" />
              <input
                {...register('email')}
                type="email"
                placeholder="Your email address"
                className="flex-1 px-5 py-3 rounded-xl bg-sacred-800 border border-sacred-700 text-white placeholder:text-sacred-500 focus:outline-none focus:ring-2 focus:ring-yoga-500 focus:border-transparent text-sm"
              />
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="bg-yoga-600 hover:bg-yoga-500 text-white border-0 whitespace-nowrap"
              >
                Subscribe
              </Button>
              {errors.email && <p className="text-red-400 text-xs text-left">{errors.email.message}</p>}
            </form>
          )}

          <p className="text-sacred-500 text-xs mt-4">
            We respect your privacy. Unsubscribe any time.
          </p>
        </div>
      </div>
    </section>
  )
}
