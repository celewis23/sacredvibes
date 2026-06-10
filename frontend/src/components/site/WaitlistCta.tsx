'use client'

import { useState, useRef } from 'react'
import { leadsApi } from '@/lib/api'

const PEEK_URL = 'https://book.peek.com/s/aa6db2ed-6695-4cb9-802d-ebcaa6a4c043/XR74D?fbclid=PARlRTSASVp5xleHRuA2FlbQExAHNydGMGYXBwX2lkDzEyNDAyNDU3NDI4NzQxNAABp1R0cYt6eQg-N-TX5N6jLXW_lmbm2o7Y02GH7qWjDiNrO0qbHcy2u33IA1HP_aem_vBDAdH30JCP6l6l4ajZPdQ'

type Props = {
  brandId: string
  className?: string
}

type Stage = 'idle' | 'input' | 'submitting' | 'done'

export default function WaitlistCta({ brandId, className }: Props) {
  const [stage, setStage] = useState<Stage>('idle')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function openInput() {
    setStage('input')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setError('')
    setStage('submitting')

    try {
      await leadsApi.submitLead({
        brandId,
        type: 'NewsletterSignup',
        email: email.trim(),
        newsletterOptIn: true,
        source: 'SoundOnTheRiver',
      })
    } catch {
      // Don't block the booking flow if the lead capture fails
    }

    window.open(PEEK_URL, '_blank', 'noopener,noreferrer')
    setStage('done')
  }

  if (stage === 'done') {
    return (
      <p className={`font-body text-sm text-sound-200 ${className ?? ''}`}>
        You&apos;re on the list — booking page opened in a new tab!
      </p>
    )
  }

  if (stage === 'idle') {
    return (
      <button
        onClick={openInput}
        className={className}
      >
        Take Me To The Vibes
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-2 ${className ?? ''}`}>
      <input
        ref={inputRef}
        type="email"
        value={email}
        onChange={e => { setEmail(e.target.value); setError('') }}
        placeholder="Enter your email address"
        required
        disabled={stage === 'submitting'}
        className="flex-1 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/60 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={stage === 'submitting'}
        className="shrink-0 rounded-full bg-sound-500 px-6 py-2.5 text-sm font-body text-white transition-colors hover:bg-sound-400 disabled:opacity-60"
      >
        {stage === 'submitting' ? '…' : 'Go'}
      </button>
      {error && <p className="w-full text-xs text-red-300 px-2">{error}</p>}
    </form>
  )
}
