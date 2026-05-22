'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { authApi } from '@/lib/api'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type FormValues = z.infer<typeof schema>

export default function AdminForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await authApi.forgotPassword(values.email)
      setSent(true)
    } catch {
      toast.error('Unable to request a reset link right now')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sacred-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yoga-600 to-yoga-800 flex items-center justify-center text-white font-heading font-bold text-2xl mx-auto mb-4 shadow-soft">
            SV
          </div>
          <h1 className="font-heading text-2xl text-sacred-900">Reset Admin Password</h1>
          <p className="text-sm text-sacred-500 mt-1">Send a secure reset link to your admin email.</p>
        </div>

        <div className="bg-white rounded-2xl border border-sacred-100 shadow-soft p-8">
          {sent ? (
            <div className="space-y-5 text-center">
              <p className="text-sm text-sacred-600">
                If that admin email exists, a reset link has been sent.
              </p>
              <Button type="button" size="lg" fullWidth onClick={() => setSent(false)}>
                Send Another Link
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                {...register('email')}
                label="Email Address"
                type="email"
                placeholder="admin@sacredvibesyoga.com"
                error={errors.email?.message}
                autoComplete="email"
                fullWidth
              />
              <Button type="submit" isLoading={isSubmitting} size="lg" fullWidth>
                Send Reset Link
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/admin/login" className="text-xs text-sacred-500 hover:text-yoga-600 transition-colors">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
