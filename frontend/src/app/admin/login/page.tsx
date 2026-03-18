'use client'

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

export default function AdminLoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values.email, values.password)
      router.push('/admin')
    } catch {
      toast.error('Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sacred-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yoga-600 to-yoga-800 flex items-center justify-center text-white font-heading font-bold text-2xl mx-auto mb-4 shadow-soft">
            SV
          </div>
          <h1 className="font-heading text-2xl text-sacred-900">Sacred Vibes Admin</h1>
          <p className="text-sm text-sacred-500 mt-1">Sign in to your account</p>
        </div>

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

          <div className="mt-6 text-center">
            <a href="#" className="text-xs text-sacred-500 hover:text-yoga-600 transition-colors">
              Forgot your password?
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-sacred-400 mt-6">
          Sacred Vibes Yoga Admin Console
        </p>
      </div>
    </div>
  )
}
