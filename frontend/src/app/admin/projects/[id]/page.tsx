'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from 'next/link'
import TipTapLink from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import {
  ArrowLeft, Save, Music, Image as ImageIcon, FileText, Plus, X, ExternalLink,
  Trash2, GripVertical, Loader2, Search, Play, Link2, LogIn, LogOut,
} from 'lucide-react'
import { toast } from 'sonner'
import { projectsApi } from '@/lib/api'
import type { Project, ProjectImage, ProjectTrack } from '@/types'

// ── Spotify helpers ────────────────────────────────────────────────────────────

const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? ''
const SPOTIFY_SCOPES = 'user-read-private playlist-read-private'

function getSpotifyTokens() {
  if (typeof window === 'undefined') return null
  const at = localStorage.getItem('spotify_access_token')
  const exp = localStorage.getItem('spotify_expires_at')
  if (!at || !exp) return null
  if (Date.now() > parseInt(exp, 10)) return null
  return { accessToken: at }
}

function clearSpotifyTokens() {
  localStorage.removeItem('spotify_access_token')
  localStorage.removeItem('spotify_refresh_token')
  localStorage.removeItem('spotify_expires_at')
}

async function generatePKCE() {
  const verifier = crypto.getRandomValues(new Uint8Array(32))
  const verifierStr = btoa(String.fromCharCode(...verifier)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const encoder = new TextEncoder()
  const data = encoder.encode(verifierStr)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return { verifier: verifierStr, challenge }
}

async function spotifySearch(query: string, type: 'track' | 'playlist', token: string) {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=20`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error('Spotify search failed')
  return res.json()
}

// ── Pinterest helpers ──────────────────────────────────────────────────────────

const PINTEREST_CLIENT_ID = process.env.NEXT_PUBLIC_PINTEREST_CLIENT_ID ?? ''

function getPinterestTokens() {
  if (typeof window === 'undefined') return null
  const at = localStorage.getItem('pinterest_access_token')
  const exp = localStorage.getItem('pinterest_expires_at')
  if (!at || !exp) return null
  if (Date.now() > parseInt(exp, 10)) return null
  return { accessToken: at }
}

function clearPinterestTokens() {
  localStorage.removeItem('pinterest_access_token')
  localStorage.removeItem('pinterest_expires_at')
}

async function pinterestSearch(query: string, token: string) {
  const res = await fetch(
    `https://api.pinterest.com/v5/pins?query=${encodeURIComponent(query)}&page_size=25`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error('Pinterest search failed')
  return res.json()
}

async function pinterestGetBoards(token: string) {
  const res = await fetch('https://api.pinterest.com/v5/boards?page_size=25', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load boards')
  return res.json()
}

async function pinterestGetBoardPins(boardId: string, token: string) {
  const res = await fetch(`https://api.pinterest.com/v5/boards/${boardId}/pins?page_size=25`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load pins')
  return res.json()
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// ── TipTap toolbar ─────────────────────────────────────────────────────────────

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null
  const btn = (active: boolean, onClick: () => void, label: string, children: React.ReactNode) => (
    <button
      key={label}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={label}
      className={`px-2 py-1 text-xs rounded transition-colors ${
        active ? 'bg-sacred-800 text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50">
      {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Bold', <strong>B</strong>)}
      {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italic', <em>I</em>)}
      {btn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), 'Strikethrough', <s>S</s>)}
      <span className="w-px h-4 bg-gray-300 mx-1" />
      {btn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'H1', 'H1')}
      {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', 'H2')}
      {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3', 'H3')}
      <span className="w-px h-4 bg-gray-300 mx-1" />
      {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Bullet list', '• List')}
      {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Numbered list', '1. List')}
      {btn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), 'Blockquote', '❝')}
      {btn(editor.isActive('code'), () => editor.chain().focus().toggleCode().run(), 'Code', '<>')}
      <span className="w-px h-4 bg-gray-300 mx-1" />
      {btn(false, () => editor.chain().focus().setHorizontalRule().run(), 'Divider', '—')}
      {btn(false, () => editor.chain().focus().undo().run(), 'Undo', '↩')}
      {btn(false, () => editor.chain().focus().redo().run(), 'Redo', '↪')}
    </div>
  )
}

// ── Spotify search modal ───────────────────────────────────────────────────────

function SpotifyModal({
  onClose,
  onAdd,
  projectId,
}: {
  onClose: () => void
  onAdd: (track: Omit<ProjectTrack, 'id' | 'sortOrder'>) => void
  projectId: string
}) {
  const [tokens, setTokens] = useState(getSpotifyTokens)
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'track' | 'playlist'>('track')
  const [results, setResults] = useState<SpotifyItem[]>([])
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const connectSpotify = async () => {
    setConnecting(true)
    const { verifier, challenge } = await generatePKCE()
    sessionStorage.setItem('spotify_verifier', verifier)
    sessionStorage.setItem('spotify_return', `/admin/projects/${projectId}`)

    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: `${window.location.origin}/admin/projects/spotify-callback`,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      scope: SPOTIFY_SCOPES,
    })

    window.location.href = `https://accounts.spotify.com/authorize?${params}`
  }

  const search = async () => {
    if (!query.trim() || !tokens) return
    setLoading(true)
    try {
      const data = await spotifySearch(query, type, tokens.accessToken)
      if (type === 'track') {
        setResults(data.tracks?.items ?? [])
      } else {
        setResults(data.playlists?.items ?? [])
      }
    } catch {
      toast.error('Spotify search failed — try reconnecting')
      clearSpotifyTokens()
      setTokens(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#1DB954] flex items-center justify-center">
              <Music size={12} className="text-white" />
            </div>
            <h2 className="font-semibold text-gray-900">Add Music from Spotify</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {!tokens ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-[#1DB954]/10 flex items-center justify-center">
              <Music size={28} className="text-[#1DB954]" />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-900 mb-1">Connect Spotify</p>
              <p className="text-sm text-gray-500">Sign in to search and add tracks and playlists.</p>
            </div>
            <button
              onClick={connectSpotify}
              disabled={connecting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1DB954] text-white text-sm font-medium rounded-full hover:bg-[#1aa34a] disabled:opacity-50 transition-colors"
            >
              {connecting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              Connect Spotify
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setType('track')}
                  className={`px-4 py-1.5 text-sm rounded-full transition-colors ${type === 'track' ? 'bg-[#1DB954] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Tracks
                </button>
                <button
                  onClick={() => setType('playlist')}
                  className={`px-4 py-1.5 text-sm rounded-full transition-colors ${type === 'playlist' ? 'bg-[#1DB954] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Playlists
                </button>
                <button
                  onClick={() => { clearSpotifyTokens(); setTokens(null) }}
                  className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
                >
                  <LogOut size={12} />
                  Disconnect
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search()}
                  placeholder={type === 'track' ? 'Search tracks...' : 'Search playlists...'}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
                />
                <button
                  onClick={search}
                  disabled={loading || !query.trim()}
                  className="px-4 py-2 bg-[#1DB954] text-white rounded-lg text-sm disabled:opacity-50 hover:bg-[#1aa34a] transition-colors"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 px-4">
              {results.map((item) => (
                <SpotifyResultRow key={item.id} item={item} type={type} onAdd={onAdd} />
              ))}
              {results.length === 0 && !loading && (
                <p className="text-center text-sm text-gray-400 py-10">
                  {query ? 'No results found.' : 'Search for a track or playlist above.'}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

interface SpotifyItem {
  id: string
  name: string
  uri: string
  external_urls?: { spotify?: string }
  duration_ms?: number
  preview_url?: string
  artists?: { name: string }[]
  album?: { name: string; images?: { url: string }[] }
  images?: { url: string }[]
  owner?: { display_name?: string }
  tracks?: { total: number }
}

function SpotifyResultRow({ item, type, onAdd }: {
  item: SpotifyItem
  type: 'track' | 'playlist'
  onAdd: (track: Omit<ProjectTrack, 'id' | 'sortOrder'>) => void
}) {
  const img = type === 'track' ? item.album?.images?.[0]?.url : item.images?.[0]?.url
  const subtitle = type === 'track'
    ? item.artists?.map(a => a.name).join(', ')
    : `by ${item.owner?.display_name ?? 'Unknown'} · ${item.tracks?.total ?? '?'} tracks`

  return (
    <div className="flex items-center gap-3 py-2.5">
      {img ? (
        <img src={img} alt={item.name} className="w-10 h-10 rounded object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center shrink-0">
          <Music size={16} className="text-gray-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        <p className="text-xs text-gray-500 truncate">{subtitle}</p>
      </div>
      {type === 'track' && item.duration_ms && (
        <span className="text-xs text-gray-400 shrink-0">{formatDuration(item.duration_ms)}</span>
      )}
      <button
        onClick={() => onAdd({
          spotifyId: item.id,
          type: type === 'track' ? 'Track' : 'Playlist',
          title: item.name,
          artist: type === 'track' ? item.artists?.map(a => a.name).join(', ') : item.owner?.display_name,
          albumName: type === 'track' ? item.album?.name : undefined,
          albumArtUrl: img,
          previewUrl: item.preview_url ?? undefined,
          spotifyUri: item.uri,
          externalUrl: item.external_urls?.spotify,
          durationMs: item.duration_ms ?? 0,
        })}
        className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-[#1DB954] text-white text-xs rounded-full hover:bg-[#1aa34a] transition-colors"
      >
        <Plus size={12} />
        Add
      </button>
    </div>
  )
}

// ── Pinterest modal ────────────────────────────────────────────────────────────

function PinterestModal({
  onClose,
  onAdd,
  projectId,
}: {
  onClose: () => void
  onAdd: (image: Omit<ProjectImage, 'id' | 'sortOrder'>) => void
  projectId: string
}) {
  const [tokens, setTokens] = useState(getPinterestTokens)
  const [tab, setTab] = useState<'search' | 'boards' | 'manual'>('boards')
  const [query, setQuery] = useState('')
  const [manualUrl, setManualUrl] = useState('')
  const [manualSourceUrl, setManualSourceUrl] = useState('')
  const [manualTitle, setManualTitle] = useState('')
  const [results, setResults] = useState<PinterestPin[]>([])
  const [boards, setBoards] = useState<PinterestBoard[]>([])
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null)
  const [boardPins, setBoardPins] = useState<PinterestPin[]>([])
  const [loading, setLoading] = useState(false)

  const connectPinterest = () => {
    const state = crypto.randomUUID()
    sessionStorage.setItem('pinterest_state', state)
    sessionStorage.setItem('pinterest_return', `/admin/projects/${projectId}`)
    const params = new URLSearchParams({
      client_id: PINTEREST_CLIENT_ID,
      redirect_uri: `${window.location.origin}/api/auth/pinterest/callback`,
      response_type: 'code',
      scope: 'boards:read,pins:read',
      state,
    })
    window.location.href = `https://www.pinterest.com/oauth/?${params}`
  }

  const loadBoards = useCallback(async () => {
    if (!tokens) return
    setLoading(true)
    try {
      const data = await pinterestGetBoards(tokens.accessToken)
      setBoards(data.items ?? [])
    } catch {
      toast.error('Failed to load boards')
      clearPinterestTokens()
      setTokens(null)
    } finally {
      setLoading(false)
    }
  }, [tokens])

  useEffect(() => {
    if (tokens && tab === 'boards') loadBoards()
  }, [tokens, tab, loadBoards])

  const loadBoardPins = async (boardId: string) => {
    if (!tokens) return
    setSelectedBoard(boardId)
    setLoading(true)
    try {
      const data = await pinterestGetBoardPins(boardId, tokens.accessToken)
      setBoardPins(data.items ?? [])
    } catch {
      toast.error('Failed to load pins')
    } finally {
      setLoading(false)
    }
  }

  const search = async () => {
    if (!query.trim() || !tokens) return
    setLoading(true)
    try {
      const data = await pinterestSearch(query, tokens.accessToken)
      setResults(data.items ?? [])
    } catch {
      toast.error('Pinterest search failed')
    } finally {
      setLoading(false)
    }
  }

  const addManual = () => {
    if (!manualUrl.trim()) return
    onAdd({ url: manualUrl.trim(), sourceUrl: manualSourceUrl.trim() || undefined, title: manualTitle.trim() || undefined, description: undefined, source: 'Manual' })
    setManualUrl('')
    setManualSourceUrl('')
    setManualTitle('')
    toast.success('Image added')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
              <ImageIcon size={12} className="text-white" />
            </div>
            <h2 className="font-semibold text-gray-900">Add Images</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-3">
          {(['boards', 'search', 'manual'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs rounded-full capitalize transition-colors ${tab === t ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t === 'boards' ? 'My Boards' : t === 'manual' ? 'Paste URL' : 'Search Pins'}
            </button>
          ))}
          <a
            href="https://pinterest.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-red-600"
          >
            <ExternalLink size={12} />
            Open Pinterest
          </a>
        </div>

        {tab === 'manual' ? (
          <div className="flex-1 p-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Image URL <span className="text-red-500">*</span></label>
              <input
                type="url"
                value={manualUrl}
                onChange={e => setManualUrl(e.target.value)}
                placeholder="https://i.pinimg.com/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pinterest Pin URL <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="url"
                value={manualSourceUrl}
                onChange={e => setManualSourceUrl(e.target.value)}
                placeholder="https://pinterest.com/pin/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="text"
                value={manualTitle}
                onChange={e => setManualTitle(e.target.value)}
                placeholder="Add a label for this image..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
            <button
              onClick={addManual}
              disabled={!manualUrl.trim()}
              className="w-full py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors"
            >
              Add Image
            </button>
            <p className="text-xs text-gray-400 text-center">
              Browse <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="text-red-500 underline">Pinterest</a>, copy an image URL, and paste it above.
            </p>
          </div>
        ) : !tokens ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <ImageIcon size={28} className="text-red-600" />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-900 mb-1">Connect Pinterest</p>
              <p className="text-sm text-gray-500">Sign in to browse your boards and pins.</p>
            </div>
            <button
              onClick={connectPinterest}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-full hover:bg-red-700 transition-colors"
            >
              <LogIn size={16} />
              Connect Pinterest
            </button>
          </div>
        ) : tab === 'search' ? (
          <>
            <div className="flex gap-2 px-4 pt-3">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="Search your pins..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <button
                onClick={search}
                disabled={loading || !query.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-red-700 transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
              ) : (
                <PinterestPinGrid pins={results} onAdd={(pin) => onAdd(pin)} />
              )}
            </div>
          </>
        ) : (
          // Boards tab
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={24} className="animate-spin text-gray-400" />
              </div>
            ) : selectedBoard ? (
              <>
                <button onClick={() => { setSelectedBoard(null); setBoardPins([]) }} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 mb-3">
                  <ArrowLeft size={12} />
                  Back to boards
                </button>
                <PinterestPinGrid pins={boardPins} onAdd={(pin) => onAdd(pin)} />
              </>
            ) : boards.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-10">No boards found.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {boards.map(board => (
                  <button
                    key={board.id}
                    onClick={() => loadBoardPins(board.id)}
                    className="text-left rounded-xl overflow-hidden border border-gray-200 hover:border-red-300 hover:shadow-soft transition-all"
                  >
                    {board.media?.image_cover_url ? (
                      <img src={board.media.image_cover_url} alt={board.name} className="w-full h-24 object-cover" />
                    ) : (
                      <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                        <ImageIcon size={20} className="text-gray-300" />
                      </div>
                    )}
                    <div className="p-2.5">
                      <p className="text-sm font-medium text-gray-800 truncate">{board.name}</p>
                      <p className="text-xs text-gray-400">{board.pin_count ?? 0} pins</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tokens && tab !== 'manual' && (
          <div className="px-4 pb-3 flex justify-end">
            <button onClick={() => { clearPinterestTokens(); setTokens(null) }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500">
              <LogOut size={12} />
              Disconnect Pinterest
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface PinterestPin {
  id: string
  title?: string
  description?: string
  media?: { images?: { '600x': { url: string } } }
  link?: string
}

interface PinterestBoard {
  id: string
  name: string
  pin_count?: number
  media?: { image_cover_url?: string }
}

function PinterestPinGrid({ pins, onAdd }: {
  pins: PinterestPin[]
  onAdd: (image: Omit<ProjectImage, 'id' | 'sortOrder'>) => void
}) {
  if (pins.length === 0) return <p className="text-center text-sm text-gray-400 py-10">No pins found.</p>
  return (
    <div className="columns-2 sm:columns-3 gap-2 space-y-2">
      {pins.map(pin => {
        const imgUrl = pin.media?.images?.['600x']?.url
        if (!imgUrl) return null
        return (
          <div key={pin.id} className="relative group break-inside-avoid">
            <img src={imgUrl} alt={pin.title ?? ''} className="w-full rounded-lg" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
              <button
                onClick={() => onAdd({
                  url: imgUrl,
                  sourceUrl: pin.link,
                  title: pin.title ?? undefined,
                  description: pin.description ?? undefined,
                  source: 'Pinterest',
                })}
                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2.5 py-1 bg-white text-gray-900 text-xs rounded-full font-medium shadow-lg"
              >
                <Plus size={12} />
                Add
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main workspace ─────────────────────────────────────────────────────────────

export default function ProjectWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'visuals' | 'notes' | 'music'>('notes')
  const [showSpotify, setShowSpotify] = useState(false)
  const [showPinterest, setShowPinterest] = useState(false)
  const [titleEdit, setTitleEdit] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id).then(r => r.data.data!),
  })

  const project = projectData

  useEffect(() => {
    if (project) setTitleEdit(project.title)
  }, [project])

  // Check for OAuth callbacks (Spotify / Pinterest tokens set in URL hash)
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('spotify_access_token')) {
      const params = new URLSearchParams(hash.slice(1))
      const at = params.get('spotify_access_token')
      const exp = params.get('spotify_expires_in')
      if (at) {
        localStorage.setItem('spotify_access_token', at)
        localStorage.setItem('spotify_expires_at', String(Date.now() + parseInt(exp ?? '3600', 10) * 1000))
        window.history.replaceState(null, '', window.location.pathname)
        toast.success('Spotify connected!')
      }
    }
    if (hash.includes('pinterest_access_token')) {
      const params = new URLSearchParams(hash.slice(1))
      const at = params.get('pinterest_access_token')
      const exp = params.get('pinterest_expires_in')
      if (at) {
        localStorage.setItem('pinterest_access_token', at)
        localStorage.setItem('pinterest_expires_at', String(Date.now() + parseInt(exp ?? '3600', 10) * 1000))
        window.history.replaceState(null, '', window.location.pathname)
        toast.success('Pinterest connected!')
      }
    }
  }, [])

  const updateMutation = useMutation({
    mutationFn: (data: { title: string; description?: string; notes?: string; coverImageUrl?: string }) =>
      projectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    onError: () => toast.error('Failed to save'),
  })

  const addImageMutation = useMutation({
    mutationFn: (data: Parameters<typeof projectsApi.addImage>[1]) => projectsApi.addImage(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', id] }),
    onError: () => toast.error('Failed to add image'),
  })

  const removeImageMutation = useMutation({
    mutationFn: (imageId: string) => projectsApi.removeImage(id, imageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', id] }),
    onError: () => toast.error('Failed to remove image'),
  })

  const addTrackMutation = useMutation({
    mutationFn: (data: Parameters<typeof projectsApi.addTrack>[1]) => projectsApi.addTrack(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      toast.success('Track added')
    },
    onError: () => toast.error('Failed to add track'),
  })

  const removeTrackMutation = useMutation({
    mutationFn: (trackId: string) => projectsApi.removeTrack(id, trackId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', id] }),
    onError: () => toast.error('Failed to remove track'),
  })

  const editor = useEditor({
    extensions: [
      StarterKit,
      TipTapLink.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: 'Add notes, cues, talking points...' }),
    ],
    content: project?.notes ?? '',
    onUpdate: ({ editor }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      setSaveStatus('saving')
      saveTimer.current = setTimeout(() => {
        if (!project) return
        updateMutation.mutate({
          title: titleEdit || project.title,
          description: project.description ?? undefined,
          notes: editor.getHTML(),
          coverImageUrl: project.coverImageUrl ?? undefined,
        })
      }, 1500)
    },
  })

  useEffect(() => {
    if (editor && project?.notes && editor.isEmpty) {
      editor.commands.setContent(project.notes)
    }
  }, [editor, project?.notes])

  const saveTitle = () => {
    if (!project || titleEdit.trim() === project.title) return
    updateMutation.mutate({
      title: titleEdit.trim() || project.title,
      description: project.description ?? undefined,
      notes: editor?.getHTML() ?? project.notes ?? undefined,
      coverImageUrl: project.coverImageUrl ?? undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={28} className="animate-spin text-sacred-400" />
      </div>
    )
  }

  if (!project) return <div className="p-8 text-gray-500">Project not found.</div>

  const TABS = [
    { key: 'visuals' as const, label: 'Visuals', icon: ImageIcon, count: project.imageCount },
    { key: 'notes' as const, label: 'Notes', icon: FileText, count: null },
    { key: 'music' as const, label: 'Music', icon: Music, count: project.trackCount },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center gap-3 shrink-0">
        <Link href="/admin/projects" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <input
          type="text"
          value={titleEdit}
          onChange={e => setTitleEdit(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={e => e.key === 'Enter' && (e.currentTarget.blur())}
          className="flex-1 text-lg font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-0 min-w-0 truncate"
          placeholder="Project title..."
        />
        <span className={`text-xs transition-opacity ${saveStatus === 'idle' ? 'opacity-0' : 'opacity-100'} ${saveStatus === 'saved' ? 'text-green-600' : 'text-gray-400'}`}>
          {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
        </span>
        <button
          onClick={() => updateMutation.mutate({
            title: titleEdit || project.title,
            description: project.description ?? undefined,
            notes: editor?.getHTML() ?? project.notes ?? undefined,
            coverImageUrl: project.coverImageUrl ?? undefined,
          })}
          disabled={updateMutation.isPending}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-sacred-800 text-white text-sm rounded-lg hover:bg-sacred-900 disabled:opacity-50 transition-colors"
        >
          <Save size={14} />
          Save
        </button>
      </header>

      {/* Mobile tabs */}
      <div className="lg:hidden flex border-b border-gray-200 bg-white shrink-0">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'text-sacred-800 border-sacred-800'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span className="ml-0.5 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{tab.count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">

        {/* ── VISUALS panel ── */}
        <div className={`${activeTab === 'visuals' ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-72 xl:w-80 border-r border-gray-200 bg-white overflow-hidden`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <ImageIcon size={14} />
              Visuals
              {project.imageCount > 0 && (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{project.imageCount}</span>
              )}
            </h2>
            <button
              onClick={() => setShowPinterest(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white text-xs rounded-full hover:bg-red-700 transition-colors"
            >
              <Plus size={12} />
              Add
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {project.images.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <ImageIcon size={24} className="text-gray-300 mb-2" />
                <p className="text-xs text-gray-400">No images yet</p>
                <button onClick={() => setShowPinterest(true)} className="mt-2 text-xs text-red-600 underline underline-offset-2">Add from Pinterest</button>
              </div>
            ) : (
              <div className="columns-2 gap-2 space-y-2">
                {project.images.map(img => (
                  <div key={img.id} className="relative group break-inside-avoid rounded-lg overflow-hidden">
                    <img src={img.url} alt={img.title ?? ''} className="w-full" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-start justify-end p-1.5 gap-1">
                      {img.sourceUrl && (
                        <a
                          href={img.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-full shadow"
                        >
                          <ExternalLink size={11} className="text-gray-700" />
                        </a>
                      )}
                      <button
                        onClick={() => removeImageMutation.mutate(img.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-full shadow"
                      >
                        <X size={11} className="text-red-600" />
                      </button>
                    </div>
                    {img.title && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white truncate">{img.title}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── NOTES panel ── */}
        <div className={`${activeTab === 'notes' ? 'flex' : 'hidden'} lg:flex flex-col flex-1 overflow-hidden bg-white`}>
          <div className="shrink-0">
            <EditorToolbar editor={editor} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <EditorContent
              editor={editor}
              className="h-full px-6 py-5 prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:min-h-full [&_.ProseMirror]:outline-none"
            />
          </div>
        </div>

        {/* ── MUSIC panel ── */}
        <div className={`${activeTab === 'music' ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-72 xl:w-80 border-l border-gray-200 bg-white overflow-hidden`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Music size={14} />
              Music
              {project.trackCount > 0 && (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{project.trackCount}</span>
              )}
            </h2>
            <button
              onClick={() => setShowSpotify(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#1DB954] text-white text-xs rounded-full hover:bg-[#1aa34a] transition-colors"
            >
              <Plus size={12} />
              Add
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {project.tracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Music size={24} className="text-gray-300 mb-2" />
                <p className="text-xs text-gray-400">No music yet</p>
                <button onClick={() => setShowSpotify(true)} className="mt-2 text-xs text-[#1DB954] underline underline-offset-2">Add from Spotify</button>
              </div>
            ) : (
              project.tracks.map(track => (
                <TrackRow
                  key={track.id}
                  track={track}
                  onRemove={() => removeTrackMutation.mutate(track.id)}
                />
              ))
            )}
          </div>
          {project.tracks.length > 0 && (
            <div className="p-3 border-t border-gray-100">
              <a
                href={`https://open.spotify.com/search/${encodeURIComponent(project.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2 text-xs text-[#1DB954] border border-[#1DB954]/30 rounded-lg hover:bg-[#1DB954]/5 transition-colors"
              >
                <ExternalLink size={12} />
                Open in Spotify
              </a>
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      {showSpotify && (
        <SpotifyModal
          onClose={() => setShowSpotify(false)}
          projectId={id}
          onAdd={(track) => addTrackMutation.mutate(track)}
        />
      )}
      {showPinterest && (
        <PinterestModal
          onClose={() => setShowPinterest(false)}
          projectId={id}
          onAdd={(image) => {
            addImageMutation.mutate(image)
            toast.success('Image added')
          }}
        />
      )}
    </div>
  )
}

function TrackRow({ track, onRemove }: { track: ProjectTrack; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 group transition-colors">
      <GripVertical size={14} className="text-gray-300 shrink-0 cursor-grab" />
      {track.albumArtUrl ? (
        <img src={track.albumArtUrl} alt={track.albumName ?? ''} className="w-10 h-10 rounded object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center shrink-0">
          <Music size={14} className="text-gray-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 truncate">{track.title}</p>
        <p className="text-[10px] text-gray-500 truncate">
          {track.artist ?? (track.type === 'Playlist' ? 'Playlist' : '')}
          {track.durationMs > 0 && ` · ${formatDuration(track.durationMs)}`}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {track.externalUrl && (
          <a href={track.externalUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-[#1DB954]">
            <Play size={12} />
          </a>
        )}
        {track.externalUrl && (
          <a href={track.externalUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-gray-600">
            <Link2 size={12} />
          </a>
        )}
        <button onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}
