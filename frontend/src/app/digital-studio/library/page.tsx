'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { studioApi } from '@/lib/api'
import type { StudioLibrary, StudioContentItem, StudioTier } from '@/types'

const TIER_ORDER: Record<StudioTier, number> = { Free: 0, Seeker: 1, Devotee: 2 }

const TIER_BADGE: Record<StudioTier, string> = {
  Free:    'bg-sacred-100 text-sacred-600',
  Seeker:  'bg-yoga-100 text-yoga-700',
  Devotee: 'bg-amber-100 text-amber-700',
}

function ContentCard({ item, userTier }: { item: StudioContentItem; userTier: StudioTier }) {
  const locked = item.locked
  const requiredTierOrder = TIER_ORDER[item.requiredTier as StudioTier] ?? 0
  const userTierOrder = TIER_ORDER[userTier] ?? 0
  const upgradeTier = requiredTierOrder > userTierOrder ? item.requiredTier : null

  return (
    <div className={`relative rounded-2xl border overflow-hidden transition-all ${
      locked ? 'border-sacred-100 bg-sacred-50/60' : 'border-sacred-200 bg-white hover:shadow-soft hover:border-[var(--brand-accent)]'
    }`}>
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-[var(--brand-bg)] to-sacred-100 flex items-center justify-center">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-3xl opacity-30">
            {item.category === 'SoundHealing' ? '🎵' :
             item.category === 'YogaFlows' ? '🧘' :
             item.category === 'Breathwork' ? '🌬️' :
             item.category === 'GuidedMeditation' ? '🌙' :
             item.category === 'CeremoniesAndRituals' ? '🕯️' : '✨'}
          </div>
        )}
        {locked && (
          <div className="absolute inset-0 bg-sacred-900/40 flex items-center justify-center">
            <span className="text-white text-2xl">🔒</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TIER_BADGE[item.requiredTier as StudioTier] ?? 'bg-sacred-100 text-sacred-600'}`}>
            {item.requiredTier === 'Free' ? 'Free' : item.requiredTier}
          </span>
          {item.duration && <span className="text-xs text-sacred-400">{item.duration}</span>}
        </div>
        <h3 className={`font-heading text-base leading-tight mb-1 ${locked ? 'text-sacred-400' : 'text-sacred-900'}`}>
          {item.title}
        </h3>
        {item.description && (
          <p className="text-xs text-sacred-500 line-clamp-2 mb-3">{item.description}</p>
        )}

        {locked ? (
          <Link href={`/account`}
            className="text-xs font-medium text-[var(--brand-primary)] hover:underline">
            Upgrade to {upgradeTier} to unlock &rarr;
          </Link>
        ) : (
          <Link href={`/digital-studio/watch/${item.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-[var(--brand-primary)] hover:opacity-90 transition-opacity px-3 py-1.5 rounded-full">
            <span>▶</span> Watch
          </Link>
        )}
      </div>
    </div>
  )
}

export default function LibraryPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [library, setLibrary] = useState<StudioLibrary | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/digital-studio/library')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    studioApi.getLibrary()
      .then(({ data }) => {
        if (data.success && data.data) {
          setLibrary(data.data)
          if (data.data.categories.length > 0) {
            setActiveCategory(data.data.categories[0].type)
          }
        }
      })
      .catch(() => {/* silent */})
      .finally(() => setLoading(false))
  }, [])

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const userTier = (library?.userTier ?? 'Free') as StudioTier
  const categories = library?.categories ?? []
  const activeItems = categories.find(c => c.type === activeCategory)?.items ?? []

  return (
    <div className="min-h-screen bg-[var(--brand-bg)] pt-24">
      {/* Hero */}
      <div className="bg-white border-b border-sacred-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-heading text-3xl text-sacred-900">Digital Studio</h1>
              <p className="text-sacred-500 mt-1">Your personal wellness library</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${TIER_BADGE[userTier]}`}>
                {userTier === 'Free' ? 'Explorer' : userTier} Plan
              </span>
              {userTier === 'Free' && (
                <Link href="/account"
                  className="text-xs font-medium text-white bg-[var(--brand-primary)] hover:opacity-90 transition-opacity px-4 py-2 rounded-full">
                  Upgrade
                </Link>
              )}
            </div>
          </div>

          {/* Category tabs */}
          <nav className="flex gap-2 flex-wrap mt-6">
            {categories.map(cat => (
              <button key={cat.type}
                onClick={() => setActiveCategory(cat.type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.type
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'bg-sacred-100 text-sacred-700 hover:bg-sacred-200'
                }`}>
                {cat.label}
                <span className="ml-1.5 text-xs opacity-70">({cat.items.length})</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeItems.length === 0 ? (
          <div className="text-center py-20 text-sacred-400">
            <p className="font-heading text-xl">Content coming soon</p>
            <p className="text-sm mt-2">New sessions are added regularly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {activeItems.map(item => (
              <ContentCard key={item.id} item={item} userTier={userTier} />
            ))}
          </div>
        )}

        {/* Upgrade banner for Free tier */}
        {userTier === 'Free' && activeItems.some(i => i.locked) && (
          <div className="mt-10 rounded-2xl bg-gradient-to-r from-[var(--brand-bg)] to-white border border-[var(--brand-accent)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-heading text-lg text-sacred-900">Unlock the full library</p>
              <p className="text-sm text-sacred-500 mt-1">Join Seeker for $33/month and access 60+ sessions.</p>
            </div>
            <Link href="/account"
              className="flex-shrink-0 px-6 py-3 rounded-full text-sm font-medium text-white shadow-glow transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(to right, var(--brand-primary), var(--brand-accent))' }}>
              Upgrade Now
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
