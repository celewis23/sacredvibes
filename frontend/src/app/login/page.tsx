'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { useAuth } from '@/lib/auth/context'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Required'),
})

type FormValues = z.infer<typeof schema>

export default function MemberLoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const user = await login(values.email, values.password)
      // role-based redirect — admins who hit /login still land correctly
      const role = user?.role
      router.push(role && role !== 'Member' ? '/admin' : '/account')
    } catch {
      toast.error('Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--brand-bg)] to-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl text-sacred-900">Welcome Back</h1>
          <p className="text-sm text-sacred-500 mt-2">Sign in to access your Digital Studio</p>
        </div>

        <div className="bg-white rounded-2xl border border-sacred-100 shadow-soft p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              placeholder="••••••••"
              error={errors.password?.message}
              autoComplete="current-password"
              fullWidth
            />
            <Button type="submit" isLoading={isSubmitting} size="lg" fullWidth>
              Sign In
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-sacred-500">
            <Link href="/register" className="hover:text-[var(--brand-primary)] transition-colors">
              Create an account
            </Link>
            <a href="#" className="hover:text-[var(--brand-primary)] transition-colors">
              Forgot password?
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-sacred-400 mt-6">
          Sacred Vibes Healing &amp; Wellness &mdash; Digital Studio
        </p>
      </div>
    </div>
  )
}
