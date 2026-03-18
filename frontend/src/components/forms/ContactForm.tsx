'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Input, { Textarea } from '@/components/ui/input'
import Button from '@/components/ui/button'
import { leadsApi } from '@/lib/api'

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(5, 'Message is too short'),
  serviceInterest: z.string().optional(),
  newsletterOptIn: z.boolean().default(false),
  honeypot: z.string().max(0, 'Bot detected').optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  brandId: string
  leadType?: string
  serviceOptions?: { value: string; label: string }[]
  colorScheme?: 'yoga' | 'hands' | 'sound'
  showServiceSelect?: boolean
}

export default function ContactForm({ brandId, leadType = 'ContactForm', serviceOptions, colorScheme = 'yoga', showServiceSelect }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    if (values.honeypot) return
    try {
      await leadsApi.submitLead({
        brandId,
        type: leadType,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        subject: values.subject,
        message: values.message,
        serviceInterest: values.serviceInterest,
        newsletterOptIn: values.newsletterOptIn,
        honeypotField: values.honeypot,
      })
      setSubmitted(true)
      toast.success('Message sent! We\'ll be in touch soon.')
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div className="bg-yoga-50 border border-yoga-200 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-yoga-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-yoga-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="font-heading text-2xl text-sacred-900 mb-2">Thank you for reaching out!</h3>
        <p className="text-sacred-600 text-sm">We&apos;ll respond within 1–2 business days.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Honeypot */}
      <input {...register('honeypot')} type="text" tabIndex={-1} aria-hidden className="hidden" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          {...register('firstName')}
          label="First Name"
          placeholder="Jane"
          error={errors.firstName?.message}
          fullWidth
        />
        <Input
          {...register('lastName')}
          label="Last Name"
          placeholder="Doe"
          fullWidth
        />
      </div>

      <Input
        {...register('email')}
        label="Email Address"
        type="email"
        placeholder="jane@example.com"
        error={errors.email?.message}
        fullWidth
      />

      <Input
        {...register('phone')}
        label="Phone (optional)"
        type="tel"
        placeholder="(828) 555-0000"
        fullWidth
      />

      {showServiceSelect && serviceOptions && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-sacred-700">Service Interest</label>
          <select
            {...register('serviceInterest')}
            className="rounded-xl border border-sacred-200 bg-white px-4 py-2.5 text-sm text-sacred-900 focus:outline-none focus:ring-2 focus:ring-yoga-400"
          >
            <option value="">Select a service (optional)</option>
            {serviceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      <Input
        {...register('subject')}
        label="Subject (optional)"
        placeholder="How can we help?"
        fullWidth
      />

      <Textarea
        {...register('message')}
        label="Message"
        placeholder="Tell us what you're looking for..."
        error={errors.message?.message}
        fullWidth
      />

      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          {...register('newsletterOptIn')}
          type="checkbox"
          className="mt-0.5 w-4 h-4 rounded border-sacred-300 text-yoga-600 focus:ring-yoga-400"
        />
        <span className="text-sm text-sacred-600 group-hover:text-sacred-800 transition-colors">
          Subscribe to our newsletter for class updates, events, and wellness inspiration.
        </span>
      </label>

      <Button type="submit" isLoading={isSubmitting} size="lg" fullWidth>
        Send Message
      </Button>

      <p className="text-xs text-sacred-400 text-center">
        We respect your privacy and will never share your information.
      </p>
    </form>
  )
}
