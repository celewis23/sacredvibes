'use client'

import Link from 'next/link'
import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { authApi } from '@/lib/api'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine(values => values.newPassword === values.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormValues = z.infer<typeof schema>

function AdminResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: searchParams.get('email') ?? '',
      token: searchParams.get('token') ?? '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    setValue('email', searchParams.get('email') ?? '')
    setValue('token', searchParams.get('token') ?? '')
  }, [searchParams, setValue])

  const onSubmit = async ({ email, token, newPassword }: FormValues) => {
    try {
      await authApi.resetPassword({ email, token, newPassword })
      toast.success('Password reset successfully. Sign in with your new password.')
      router.replace('/admin/login')
    } catch {
      toast.error('Reset link is invalid or expired')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-sacred-100 shadow-soft p-8">
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
        <input type="hidden" {...register('token')} />
        {errors.token?.message && (
          <p className="text-xs text-red-600">{errors.token.message}</p>
        )}
        <Input
          {...register('newPassword')}
          label="New Password"
          type="password"
          placeholder="Enter a new password"
          error={errors.newPassword?.message}
          autoComplete="new-password"
          fullWidth
        />
        <Input
          {...register('confirmPassword')}
          label="Confirm Password"
          type="password"
          placeholder="Confirm your new password"
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          fullWidth
        />
        <Button type="submit" isLoading={isSubmitting} size="lg" fullWidth>
          Reset Password
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/admin/login" className="text-xs text-sacred-500 hover:text-yoga-600 transition-colors">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}

export default function AdminResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sacred-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yoga-600 to-yoga-800 flex items-center justify-center text-white font-heading font-bold text-2xl mx-auto mb-4 shadow-soft">
            SV
          </div>
          <h1 className="font-heading text-2xl text-sacred-900">Choose a New Password</h1>
          <p className="text-sm text-sacred-500 mt-1">Enter your new admin console password.</p>
        </div>

        <Suspense fallback={null}>
          <AdminResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
