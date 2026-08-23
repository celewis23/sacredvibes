'use client'

import { FormEvent, PointerEvent as ReactPointerEvent, RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { Bot, CheckCircle2, ChevronDown, Loader2, Maximize2, MessageSquare, Send, X } from 'lucide-react'
import { clsx } from 'clsx'

function getAccessToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('access_token') ?? ''
}

function renderText(text: string) {
  return text.split('\n').map((line, index) => (
    <span key={index}>
      {line}
      {index < text.split('\n').length - 1 && <br />}
    </span>
  ))
}

function ToolPart({ part }: { part: Record<string, unknown> }) {
  const name = String(part.type ?? '').replace(/^tool-/, '')
  const state = String(part.state ?? '')
  const output = part.output
  const errorText = part.errorText
  const isDone = state === 'output-available'
  const isError = state === 'output-error'

  return (
    <div className={clsx(
      'mt-2 rounded-lg border px-3 py-2 text-xs',
      isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-sacred-200 bg-sacred-50 text-sacred-600'
    )}>
      <div className="flex items-center gap-2 font-medium text-sacred-800">
        {isDone ? <CheckCircle2 size={13} className="text-yoga-600" /> : <Loader2 size={13} className="animate-spin text-sacred-400" />}
        <span>{name || 'admin tool'}</span>
      </div>
      {isError && <p className="mt-1 text-red-700">{String(errorText ?? 'Tool failed')}</p>}
      {isDone && output !== undefined && (
        <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap break-words rounded bg-white p-2 text-[10px] leading-relaxed text-sacred-500">
          {JSON.stringify(output, null, 2)}
        </pre>
      )}
    </div>
  )
}

function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={clsx(
        'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm',
        isUser
          ? 'bg-yoga-700 text-white'
          : 'border border-sacred-100 bg-white text-sacred-800'
      )}>
        {message.parts.map((part, index) => {
          if (part.type === 'text') {
            return <div key={index} className="whitespace-pre-wrap">{renderText(part.text)}</div>
          }

          if (part.type.startsWith('tool-')) {
            return <ToolPart key={index} part={part as unknown as Record<string, unknown>} />
          }

          return null
        })}
      </div>
    </div>
  )
}

const suggestions = [
  'Create a project write-up for a sound bowl class.',
  'Find recent leads that need follow-up.',
  'Draft a blog post about sound healing for beginners.',
]

// ── Draggable positioning ──────────────────────────────────────────────────
// The bubble and the open panel can both cover content the admin needs to
// interact with (email pagination, subscriber rows, etc.), so both are
// dragged with pointer events and their position is remembered per-browser.

interface DragPos { x: number; y: number }

function loadPos(key: string): DragPos | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') return parsed
  } catch { /* ignore */ }
  return null
}

function savePos(key: string, pos: DragPos) {
  try { localStorage.setItem(key, JSON.stringify(pos)) } catch { /* ignore */ }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function useDraggable(storageKey: string, elementRef: RefObject<HTMLElement | null>) {
  const [pos, setPos] = useState<DragPos | null>(() => loadPos(storageKey))
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)
  const movedRef = useRef(false)
  const lastPosRef = useRef<DragPos | null>(null)

  // Re-clamp a restored position once the element has real dimensions, and again on resize.
  useEffect(() => {
    function reclamp() {
      const el = elementRef.current
      setPos(p => {
        if (!p || !el) return p
        const rect = el.getBoundingClientRect()
        const clamped = {
          x: clamp(p.x, 8, window.innerWidth - rect.width - 8),
          y: clamp(p.y, 8, window.innerHeight - rect.height - 8),
        }
        return clamped.x === p.x && clamped.y === p.y ? p : clamped
      })
    }
    reclamp()
    window.addEventListener('resize', reclamp)
    return () => window.removeEventListener('resize', reclamp)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef])

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const el = elementRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    dragRef.current = { startX: event.clientX, startY: event.clientY, originX: rect.left, originY: rect.top }
    movedRef.current = false
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (!movedRef.current && Math.hypot(dx, dy) < 4) return
    movedRef.current = true

    const el = elementRef.current
    const width = el?.offsetWidth ?? 0
    const height = el?.offsetHeight ?? 0
    const next = {
      x: clamp(drag.originX + dx, 8, window.innerWidth - width - 8),
      y: clamp(drag.originY + dy, 8, window.innerHeight - height - 8),
    }
    lastPosRef.current = next
    setPos(next)
  }

  const onPointerUp = () => {
    setIsDragging(false)
    dragRef.current = null
    if (movedRef.current && lastPosRef.current) {
      savePos(storageKey, lastPosRef.current)
    }
  }

  // Called from onClick — returns true (and clears the flag) if the preceding
  // gesture was a drag, so the caller can skip its normal click action.
  const consumeDragFlag = () => {
    const wasDragged = movedRef.current
    movedRef.current = false
    return wasDragged
  }

  return { pos, isDragging, onPointerDown, onPointerMove, onPointerUp, consumeDragFlag }
}

export default function AdminAssistant() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [input, setInput] = useState('')

  const bubbleRef = useRef<HTMLButtonElement>(null)
  const bubbleDrag = useDraggable('admin-assistant-bubble-pos', bubbleRef)

  const panelRef = useRef<HTMLElement>(null)
  const panelDrag = useDraggable('admin-assistant-panel-pos', panelRef)

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/admin/assistant',
    headers: () => {
      const token = getAccessToken()
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      return headers
    },
  }), [])

  const { messages, sendMessage, status, error, stop } = useChat({ transport })
  const busy = status === 'submitted' || status === 'streaming'

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    sendMessage({ text })
    setInput('')
  }

  const sendSuggestion = (text: string) => {
    if (busy) return
    setOpen(true)
    sendMessage({ text })
  }

  return (
    <>
      <button
        ref={bubbleRef}
        type="button"
        onPointerDown={bubbleDrag.onPointerDown}
        onPointerMove={bubbleDrag.onPointerMove}
        onPointerUp={bubbleDrag.onPointerUp}
        onClick={() => {
          if (bubbleDrag.consumeDragFlag()) return
          setOpen(true)
        }}
        style={bubbleDrag.pos ? { left: bubbleDrag.pos.x, top: bubbleDrag.pos.y, right: 'auto', bottom: 'auto' } : undefined}
        className={clsx(
          'fixed z-50 inline-flex h-12 w-12 touch-none select-none items-center justify-center rounded-full bg-yoga-700 text-white shadow-lg transition-colors hover:bg-yoga-800',
          !bubbleDrag.pos && 'bottom-20 right-4 lg:bottom-5',
          bubbleDrag.isDragging ? 'cursor-grabbing' : 'cursor-grab',
          open && 'hidden'
        )}
        title="Open admin assistant (drag to move)"
      >
        <MessageSquare size={20} />
      </button>

      {open && (
        <section
          ref={panelRef}
          className={clsx(
            'fixed z-50 flex flex-col overflow-hidden rounded-xl border border-sacred-200 bg-white shadow-2xl',
            expanded
              ? 'inset-3 lg:inset-6'
              : clsx(
                  'h-[min(620px,calc(100vh-6rem))] w-[calc(100vw-1.5rem)] lg:w-[440px]',
                  !panelDrag.pos && 'bottom-20 right-3 lg:bottom-5 lg:right-5'
                )
          )}
          style={!expanded && panelDrag.pos ? { left: panelDrag.pos.x, top: panelDrag.pos.y, right: 'auto', bottom: 'auto' } : undefined}
          aria-label="Admin assistant"
        >
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-sacred-100 bg-sacred-900 px-4 text-white">
            <div
              onPointerDown={!expanded ? panelDrag.onPointerDown : undefined}
              onPointerMove={!expanded ? panelDrag.onPointerMove : undefined}
              onPointerUp={!expanded ? panelDrag.onPointerUp : undefined}
              className={clsx(
                'flex min-w-0 flex-1 items-center gap-3 select-none',
                !expanded && (panelDrag.isDragging ? 'touch-none cursor-grabbing' : 'touch-none cursor-grab')
              )}
              title={!expanded ? 'Drag to move' : undefined}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yoga-700">
                <Bot size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Admin Assistant</p>
                <p className="truncate text-xs text-sacred-300">
                  {busy ? 'Working...' : 'Ready'}
                </p>
              </div>
            </div>
            {busy && (
              <button type="button" onClick={stop} className="rounded p-1.5 text-sacred-300 hover:bg-sacred-800 hover:text-white" title="Stop">
                <X size={15} />
              </button>
            )}
            <button type="button" onClick={() => setExpanded(v => !v)} className="rounded p-1.5 text-sacred-300 hover:bg-sacred-800 hover:text-white" title={expanded ? 'Collapse' : 'Expand'}>
              {expanded ? <ChevronDown size={15} /> : <Maximize2 size={15} />}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded p-1.5 text-sacred-300 hover:bg-sacred-800 hover:text-white" title="Close">
              <X size={15} />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-sacred-50 p-4">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-sacred-100 bg-white p-4 text-sm text-sacred-700 shadow-sm">
                  <p className="font-medium text-sacred-900">Ask me to draft, search, create, or update admin records.</p>
                  <p className="mt-1 text-xs text-sacred-500">I can work with projects, blog, pages, studio, media, galleries, services, events, bookings, subscribers, imports, leads, and email.</p>
                </div>
                <div className="space-y-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => sendSuggestion(suggestion)}
                      className="block w-full rounded-lg border border-sacred-100 bg-white px-3 py-2 text-left text-xs text-sacred-600 shadow-sm transition hover:border-yoga-200 hover:text-yoga-800"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => <ChatMessage key={message.id} message={message} />)
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error.message}
              </div>
            )}
          </div>

          <form onSubmit={submit} className="shrink-0 border-t border-sacred-100 bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) submit(event)
                }}
                rows={2}
                placeholder="Ask the assistant..."
                className="min-h-10 flex-1 resize-none rounded-xl border border-sacred-200 px-3 py-2 text-sm text-sacred-800 outline-none transition focus:border-yoga-400 focus:ring-2 focus:ring-yoga-100"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yoga-700 text-white transition hover:bg-yoga-800 disabled:pointer-events-none disabled:opacity-50"
                title="Send"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  )
}
