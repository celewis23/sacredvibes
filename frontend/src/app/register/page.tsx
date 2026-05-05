'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { authApi } from '@/lib/api'
import { setAuthTokens } from '@/lib/api/client'

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const { data } = await authApi.register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      })
      if (!data.success || !data.data) throw new Error(data.errors?.[0] ?? 'Registration failed')
      setAuthTokens(data.data.accessToken, data.data.refreshToken)
      toast.success(`Welcome, ${data.data.user.firstName}!`)
      router.push('/account')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--brand-bg)] to-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl text-sacred-900">Join the Studio</h1>
          <p className="text-sm text-sacred-500 mt-2">Create your free Sacred Vibes account</p>
        </div>

        <div className="bg-white rounded-2xl border border-sacred-100 shadow-soft p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                {...register('firstName')}
                label="First Name"
                placeholder="Shanna"
                error={errors.firstName?.message}
                autoComplete="given-name"
                fullWidth
              />
              <Input
                {...register('lastName')}
                label="Last Name"
                placeholder="Latia"
                error={errors.lastName?.message}
                autoComplete="family-name"
                fullWidth
              />
            </div>
            <Input
              {...register('email')}
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              autoComplete="email"
              fullWidth
            />
            <Input
              {...register('password')}
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              error={errors.password?.message}
              autoComplete="new-password"
              fullWidth
            />
            <Input
              {...register('confirmPassword')}
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
              fullWidth
            />
            <Button type="submit" isLoading={isSubmitting} size="lg" fullWidth>
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-sacred-500">
            Already have an account?{' '}
            <Link href="/login" className="hover:text-[var(--brand-primary)] transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-sacred-400 mt-6">
          Sacred Vibes Healing &amp; Wellness &mdash; Digital Studio
        </p>
      </div>
    </div>
  )
}
