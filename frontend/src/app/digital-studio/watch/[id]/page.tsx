'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { studioApi } from '@/lib/api'
import type { StudioContentItem, StudioTier } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  SoundHealing: 'Sound Healing',
  YogaFlows: 'Yoga Flows',
  Breathwork: 'Breathwork',
  GuidedMeditation: 'Guided Meditation',
  CeremoniesAndRituals: 'Ceremonies & Rituals',
  EnergyWork: 'Energy Work',
}

const TIER_BADGE: Record<StudioTier, string> = {
  Free:    'bg-sacred-100 text-sacred-600',
  Seeker:  'bg-yoga-100 text-yoga-700',
  Devotee: 'bg-amber-100 text-amber-700',
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>()
  const { isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [content, setContent] = useState<StudioContentItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=/digital-studio/watch/${id}`)
    }
  }, [isLoading, isAuthenticated, id, router])

  useEffect(() => {
    if (!id) return
    studioApi.getContent(id)
      .then(({ data }) => {
        if (data.success && data.data) {
          setContent(data.data)
        } else {
          setError('Content not found')
        }
      })
      .catch(() => setError('Could not load content'))
      .finally(() => setLoading(false))
  }, [id])

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 text-center px-4">
        <p className="font-heading text-2xl text-sacred-900 mb-2">Content not found</p>
        <p className="text-sacred-500 text-sm mb-6">This session may have moved or been removed.</p>
        <Link href="/digital-studio/library"
          className="text-sm font-medium text-[var(--brand-primary)] hover:underline">
          Back to Library
        </Link>
      </div>
    )
  }

  // Locked — member doesn't have access
  if (content.locked) {
    return (
      <div className="min-h-screen bg-[var(--brand-bg)] pt-24">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-6">🔒</div>
          <h1 className="font-heading text-3xl text-sacred-900 mb-3">{content.title}</h1>
          <p className="text-sacred-500 mb-2">This session requires the <strong>{content.requiredTier}</strong> plan.</p>
          <p className="text-sm text-sacred-400 mb-8">Upgrade your membership to unlock this and hundreds of other sessions.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/account"
              className="px-8 py-3 rounded-full text-sm font-medium text-white shadow-glow transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(to right, var(--brand-primary), var(--brand-accent))' }}>
              Upgrade Now
            </Link>
            <Link href="/digital-studio/library"
              className="px-8 py-3 rounded-full text-sm font-medium border border-sacred-200 text-sacred-700 hover:border-sacred-400 transition-colors">
              Back to Library
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const categoryLabel = CATEGORY_LABELS[content.category] ?? content.category
  const tierBadge = TIER_BADGE[content.requiredTier as StudioTier] ?? 'bg-sacred-100 text-sacred-600'
  const isVideo = content.streamUrl?.match(/\.(mp4|mov|webm)$/i)
  const isAudio = content.streamUrl?.match(/\.(mp3|m4a|ogg|wav|aac)$/i)

  return (
    <div className="min-h-screen bg-sacred-950 pt-24">
      {/* Player area */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/digital-studio/library"
          className="inline-flex items-center gap-1.5 text-sm text-sacred-400 hover:text-white transition-colors mb-6">
          ← Back to Library
        </Link>

        {/* Media player */}
        <div className="rounded-2xl overflow-hidden bg-black mb-6 aspect-video flex items-center justify-center">
          {content.streamUrl && isVideo && (
            <video controls className="w-full h-full" src={content.streamUrl} poster={content.thumbnailUrl}>
              Your browser does not support video playback.
            </video>
          )}
          {content.streamUrl && isAudio && (
            <div className="w-full px-8 flex flex-col items-center gap-6">
              {content.thumbnailUrl && (
                <img src={content.thumbnailUrl} alt={content.title}
                  className="w-32 h-32 rounded-2xl object-cover shadow-2xl" />
              )}
              <audio controls className="w-full" src={content.streamUrl}>
                Your browser does not support audio playback.
              </audio>
            </div>
          )}
          {(!content.streamUrl || (!isVideo && !isAudio)) && (
            <div className="text-center text-sacred-400 px-8">
              <div className="text-5xl mb-4 opacity-40">🎵</div>
              <p className="font-heading text-xl text-sacred-200 mb-2">{content.title}</p>
              <p className="text-sm">Content is being uploaded. Check back soon.</p>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="text-white">
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${tierBadge}`}>
              {content.requiredTier === 'Free' ? 'Free' : content.requiredTier}
            </span>
            <span className="text-sm text-sacred-400">{categoryLabel}</span>
            {content.duration && <span className="text-sm text-sacred-400">{content.duration}</span>}
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl text-white mb-3">{content.title}</h1>
          {content.description && (
            <p className="text-sacred-300 text-sm leading-relaxed max-w-2xl">{content.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
