'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { useAuth } from '@/lib/auth/context'
import { isAdminRole } from '@/lib/auth/roles'
import { authApi, studioApi } from '@/lib/api'
import type { MemberSubscription } from '@/types'

// ── Schemas ───────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  bio: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

// ── Plan metadata ─────────────────────────────────────────────────────────────

const PLAN_INFO = {
  Free: {
    label: 'Explorer',
    price: 'Free',
    badge: 'bg-sacred-100 text-sacred-700',
    features: ['2 sound healing sessions', '3 introductory yoga classes', 'Weekly newsletter', 'Community access'],
  },
  Seeker: {
    label: 'Seeker',
    price: '$33 / month',
    badge: 'bg-yoga-100 text-yoga-700',
    features: ['Full sound healing library (12+ sessions)', 'All yoga flows (24+)', 'New content monthly', 'Live monthly ceremonies', 'Member event discounts'],
  },
  Devotee: {
    label: 'Devotee',
    price: '$88 / month',
    badge: 'bg-amber-100 text-amber-700',
    features: ['Everything in Seeker', 'Breathwork & meditation library', 'Ceremonies & energy work', '1 private session / month', 'Early event access'],
  },
} as const

const CONTENT_CATEGORIES = [
  { label: 'Sound Healing',       tier: 'Free' as const },
  { label: 'Yoga Flows',          tier: 'Free' as const },
  { label: 'Breathwork',          tier: 'Seeker' as const },
  { label: 'Guided Meditation',   tier: 'Seeker' as const },
  { label: 'Ceremonies & Rituals',tier: 'Devotee' as const },
  { label: 'Energy Work',         tier: 'Devotee' as const },
]

const TIER_ORDER = { Free: 0, Seeker: 1, Devotee: 2 } as const

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'password'>('overview')
  const [subscription, setSubscription] = useState<MemberSubscription | null>(null)
  const [subLoading, setSubLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: '', lastName: '', bio: '' },
  })
  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) })

  useEffect(() => {
    if (user) {
      profileForm.reset({ firstName: user.firstName, lastName: user.lastName, bio: user.bio ?? '' })
    }
  }, [user, profileForm])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login')
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isLoading && user && isAdminRole(user.role)) router.replace('/admin')
  }, [isLoading, user, router])

  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      toast.success('Subscription activated! Welcome to the studio.')
    }
  }, [searchParams])

  // Load live subscription once user is known
  useEffect(() => {
    if (!user || user.role !== 'Member') return
    setSubLoading(true)
    studioApi.getSubscription()
      .then(({ data }) => { if (data.success && data.data) setSubscription(data.data) })
      .catch(() => {/* silent */})
      .finally(() => setSubLoading(false))
  }, [user])

  const handleUpgrade = async (tier: string) => {
    setCheckoutLoading(tier)
    try {
      const { data } = await studioApi.createCheckout(tier)
      if (data.success && data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl
      }
    } catch {
      toast.error('Could not start checkout. Please try again.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const handleManage = async () => {
    setPortalLoading(true)
    try {
      const { data } = await studioApi.createPortal()
      if (data.success && data.data?.portalUrl) {
        window.location.href = data.data.portalUrl
      }
    } catch {
      toast.error('Could not open billing portal. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  const onSaveProfile = async (values: ProfileValues) => {
    try {
      await authApi.updateProfile(values)
      toast.success('Profile updated')
    } catch {
      toast.error('Could not update profile')
    }
  }

  const onChangePassword = async (values: PasswordValues) => {
    try {
      await authApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword })
      toast.success('Password changed — please sign in again')
      await logout()
      router.push('/login')
    } catch {
      toast.error('Current password is incorrect')
    }
  }

  if (isLoading || !user || isAdminRole(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const tierKey = (subscription?.tier ?? user.studioTier ?? 'Free') as keyof typeof PLAN_INFO
  const plan = PLAN_INFO[tierKey] ?? PLAN_INFO.Free
  const tierOrder = TIER_ORDER[tierKey] ?? 0
  const isActiveSub = subscription?.isActive ?? false
  const hasPaidPlan = tierKey !== 'Free'

  return (
    <div className="min-h-screen bg-[var(--brand-bg)] pt-24">
      {/* Header */}
      <div className="bg-white border-b border-sacred-100">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl text-sacred-900">Welcome back, {user.firstName}</h1>
            <p className="text-sm text-sacred-500 mt-0.5">{user.email}</p>
          </div>
          <button onClick={async () => { await logout(); router.push('/') }}
            className="text-sm text-sacred-500 hover:text-sacred-800 transition-colors">
            Sign out
          </button>
        </div>
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex gap-6 text-sm">
            {(['overview', 'profile', 'password'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`pb-3 border-b-2 capitalize transition-colors ${activeTab === tab
                  ? 'border-[var(--brand-primary)] text-sacred-900 font-medium'
                  : 'border-transparent text-sacred-500 hover:text-sacred-700'}`}>
                {tab === 'overview' ? 'My Studio' : tab === 'password' ? 'Password' : 'Profile'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <>
            {/* Subscription card */}
            <div className="bg-white rounded-2xl border border-sacred-100 shadow-soft p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-heading text-xl text-sacred-900">Your Membership</h2>
                  <p className="text-sm text-sacred-500 mt-1">Current plan and studio access</p>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${plan.badge}`}>
                  {plan.label}
                </span>
              </div>

              {subLoading ? (
                <div className="h-6 bg-sacred-100 rounded animate-pulse w-32 mb-4" />
              ) : (
                <p className="text-2xl font-heading text-sacred-900 mb-1">{plan.price}</p>
              )}

              {hasPaidPlan && subscription?.currentPeriodEnd && (
                <p className="text-xs text-sacred-500 mb-4">
                  {isActiveSub ? 'Renews' : 'Expires'}{' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}

              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-sacred-700">
                    <span className="w-4 h-4 rounded-full bg-[var(--brand-primary)] opacity-70 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                {hasPaidPlan ? (
                  <Button size="sm" onClick={handleManage} isLoading={portalLoading}>
                    Manage Subscription
                  </Button>
                ) : (
                  <>
                    <Button size="sm" onClick={() => handleUpgrade('Seeker')} isLoading={checkoutLoading === 'Seeker'}>
                      Upgrade to Seeker — $33/mo
                    </Button>
                    <Button size="sm" onClick={() => handleUpgrade('Devotee')} isLoading={checkoutLoading === 'Devotee'}>
                      Upgrade to Devotee — $88/mo
                    </Button>
                  </>
                )}
                <a href="/digital-studio/library"
                  className="inline-flex items-center text-sm font-medium text-[var(--brand-primary)] hover:underline">
                  Go to Library &rarr;
                </a>
              </div>
            </div>

            {/* Content access grid */}
            <div className="bg-white rounded-2xl border border-sacred-100 shadow-soft p-6">
              <h2 className="font-heading text-xl text-sacred-900 mb-1">Studio Access</h2>
              <p className="text-sm text-sacred-500 mb-6">What you can access on your current plan</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CONTENT_CATEGORIES.map(cat => {
                  const locked = TIER_ORDER[cat.tier] > tierOrder
                  return (
                    <div key={cat.label}
                      className={`rounded-xl border p-4 text-sm font-medium ${locked
                        ? 'border-sacred-100 text-sacred-400 bg-sacred-50'
                        : 'border-[var(--brand-accent)] text-sacred-800 bg-white'}`}>
                      {cat.label}
                      {locked && (
                        <span className="block text-xs font-normal text-sacred-400 mt-1">
                          {cat.tier} plan required
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Profile ── */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-sacred-100 shadow-soft p-6">
            <h2 className="font-heading text-xl text-sacred-900 mb-6">Edit Profile</h2>
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4 max-w-md">
              <div className="grid grid-cols-2 gap-3">
                <Input {...profileForm.register('firstName')} label="First Name"
                  error={profileForm.formState.errors.firstName?.message} fullWidth />
                <Input {...profileForm.register('lastName')} label="Last Name"
                  error={profileForm.formState.errors.lastName?.message} fullWidth />
              </div>
              <div>
                <label className="block text-sm font-medium text-sacred-700 mb-1">Bio</label>
                <textarea {...profileForm.register('bio')} rows={3}
                  placeholder="A little about yourself..."
                  className="w-full rounded-lg border border-sacred-200 px-3 py-2 text-sm text-sacred-900 placeholder:text-sacred-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent resize-none" />
              </div>
              <Button type="submit" isLoading={profileForm.formState.isSubmitting} size="md">
                Save Changes
              </Button>
            </form>
          </div>
        )}

        {/* ── Password ── */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-2xl border border-sacred-100 shadow-soft p-6">
            <h2 className="font-heading text-xl text-sacred-900 mb-2">Change Password</h2>
            <p className="text-sm text-sacred-500 mb-6">You will be signed out after changing your password.</p>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4 max-w-md">
              <Input {...passwordForm.register('currentPassword')} label="Current Password"
                type="password" placeholder="••••••••"
                error={passwordForm.formState.errors.currentPassword?.message}
                autoComplete="current-password" fullWidth />
              <Input {...passwordForm.register('newPassword')} label="New Password"
                type="password" placeholder="Min. 8 characters"
                error={passwordForm.formState.errors.newPassword?.message}
                autoComplete="new-password" fullWidth />
              <Input {...passwordForm.register('confirmPassword')} label="Confirm New Password"
                type="password" placeholder="••••••••"
                error={passwordForm.formState.errors.confirmPassword?.message}
                autoComplete="new-password" fullWidth />
              <Button type="submit" isLoading={passwordForm.formState.isSubmitting} size="md">
                Update Password
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
