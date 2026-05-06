'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function SpotifyCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const returnTo = sessionStorage.getItem('spotify_return') ?? '/admin/projects'
    const verifier = sessionStorage.getItem('spotify_verifier')
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? ''

    if (error || !code || !verifier) {
      router.replace(returnTo)
      return
    }

    const exchange = async () => {
      try {
        const res = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: `${window.location.origin}/admin/projects/spotify-callback`,
            client_id: clientId,
            code_verifier: verifier,
          }),
        })

        if (!res.ok) throw new Error('Token exchange failed')

        const data = await res.json()
        localStorage.setItem('spotify_access_token', data.access_token)
        localStorage.setItem('spotify_refresh_token', data.refresh_token ?? '')
        localStorage.setItem('spotify_expires_at', String(Date.now() + data.expires_in * 1000))
        sessionStorage.removeItem('spotify_verifier')
        sessionStorage.removeItem('spotify_return')
      } catch {
        // Redirect back regardless — the project page will show "connect" again
      }
      router.replace(returnTo)
    }

    exchange()
  }, [searchParams, router])

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <Loader2 size={28} className="animate-spin text-[#1DB954]" />
        <p className="text-sm">Connecting Spotify...</p>
      </div>
    </div>
  )
}
