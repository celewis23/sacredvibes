'use client'

import { useState, useCallback, useEffect, use } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Reorder, useDragControls } from 'framer-motion'
import {
  ArrowLeft, Save, Globe, Plus, Trash2, GripVertical, ChevronDown, ChevronRight,
  Type, Image, AlignLeft, Columns2, Zap, Minus, Quote, Grid2x2, Star, CalendarDays, ShoppingBag
} from 'lucide-react'
import { pagesApi } from '@/lib/api'
import type { SitePage } from '@/types'

// ── Block types ──────────────────────────────────────────────────────────────

type BlockType =
  | 'hero' | 'heading' | 'text' | 'image' | 'two-column'
  | 'services' | 'events' | 'cta' | 'divider' | 'quote' | 'gallery'

interface Block {
  id: string
  type: BlockType
  props: Record<string, unknown>
}

const BLOCK_PALETTE: { type: BlockType; label: string; icon: React.ElementType; description: string }[] = [
  { type: 'hero', label: 'Hero', icon: Star, description: 'Full-width banner with headline and CTA' },
  { type: 'heading', label: 'Heading', icon: Type, description: 'Section title' },
  { type: 'text', label: 'Text', icon: AlignLeft, description: 'Rich paragraph block' },
  { type: 'image', label: 'Image', icon: Image, description: 'Full-width or inset image' },
  { type: 'two-column', label: 'Two Column', icon: Columns2, description: 'Side-by-side content' },
  { type: 'services', label: 'Services', icon: ShoppingBag, description: 'Service offerings grid' },
  { type: 'events', label: 'Events', icon: CalendarDays, description: 'Upcoming events list' },
  { type: 'gallery', label: 'Gallery', icon: Grid2x2, description: 'Photo gallery grid' },
  { type: 'cta', label: 'Call to Action', icon: Zap, description: 'Action-prompting banner' },
  { type: 'quote', label: 'Quote', icon: Quote, description: 'Blockquote with attribution' },
  { type: 'divider', label: 'Divider', icon: Minus, description: 'Horizontal separator' },
]

function defaultProps(type: BlockType): Record<string, unknown> {
  switch (type) {
    case 'hero': return { title: 'Welcome', subtitle: '', ctaText: '', ctaLink: '', alignment: 'center', background: 'gradient' }
    case 'heading': return { text: 'Section Title', level: 'h2', alignment: 'center' }
    case 'text': return { content: 'Add your text here...', alignment: 'left' }
    case 'image': return { src: '', alt: '', caption: '', width: 'full' }
    case 'two-column': return { leftContent: 'Left column text', rightContent: 'Right column text', leftWidth: '1/2' }
    case 'services': return { title: 'Our Services', maxItems: 6 }
    case 'events': return { title: 'Upcoming Events', maxItems: 6, upcomingOnly: true }
    case 'gallery': return { title: '', maxItems: 12, columns: 3 }
    case 'cta': return { title: 'Ready to begin?', subtitle: '', buttonText: 'Book Now', buttonLink: '/booking', background: 'dark' }
    case 'quote': return { text: '', author: '', source: '' }
    case 'divider': return { spacing: 'md' }
    default: return {}
  }
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ── Block canvas preview ─────────────────────────────────────────────────────

function BlockPreview({ block }: { block: Block }) {
  const p = block.props

  switch (block.type) {
    case 'hero':
      return (
        <div className="bg-gradient-to-br from-sacred-800 to-yoga-700 rounded-xl p-10 text-white text-center">
          <p className="text-2xl font-heading font-bold mb-2">{String(p.title || 'Hero Headline')}</p>
          {!!p.subtitle && <p className="text-sm opacity-80 mb-4">{String(p.subtitle)}</p>}
          {!!p.ctaText && (
            <div className="inline-block bg-white text-sacred-800 text-xs font-semibold px-4 py-1.5 rounded-full mt-2">
              {String(p.ctaText)}
            </div>
          )}
        </div>
      )
    case 'heading':
      return (
        <div className={`text-${String(p.alignment)}`}>
          <div className="text-xl font-heading font-bold text-gray-900 border-b border-dashed border-gray-200 pb-2">
            {String(p.text || 'Section Title')}
          </div>
          <div className="text-xs text-gray-400 mt-1">{String(p.level || 'h2').toUpperCase()}</div>
        </div>
      )
    case 'text':
      return (
        <div className="text-sm text-gray-600 leading-relaxed line-clamp-3">
          {String(p.content || 'Text block')}
        </div>
      )
    case 'image':
      return (
        <div className="bg-gray-100 rounded-lg flex items-center justify-center h-28 border-2 border-dashed border-gray-200">
          {p.src ? (
            <img src={String(p.src)} alt={String(p.alt || '')} className="h-full w-full object-cover rounded-lg" />
          ) : (
            <div className="text-center text-gray-400">
              <Image size={24} className="mx-auto mb-1 opacity-40" />
              <p className="text-xs">No image set</p>
            </div>
          )}
          {!!p.caption && <p className="text-xs text-gray-400 mt-1 text-center">{String(p.caption)}</p>}
        </div>
      )
    case 'two-column':
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 min-h-[60px]">{String(p.leftContent || '')}</div>
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 min-h-[60px]">{String(p.rightContent || '')}</div>
        </div>
      )
    case 'services':
      return (
        <div>
          {!!p.title && <p className="text-sm font-semibold text-gray-700 mb-2">{String(p.title)}</p>}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-yoga-50 border border-yoga-100 rounded-lg p-3 text-center">
                <div className="w-6 h-6 bg-yoga-200 rounded-full mx-auto mb-1" />
                <div className="h-2 bg-yoga-200 rounded w-12 mx-auto" />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">Showing up to {String(p.maxItems || 6)} services</p>
        </div>
      )
    case 'events':
      return (
        <div>
          {!!p.title && <p className="text-sm font-semibold text-gray-700 mb-2">{String(p.title)}</p>}
          <div className="space-y-1.5">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-3 bg-gray-50 rounded-lg p-2">
                <div className="w-10 h-10 bg-sacred-100 rounded flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-2 bg-gray-200 rounded w-3/4" />
                  <div className="h-1.5 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">{p.upcomingOnly ? 'Upcoming only' : 'All events'} · up to {String(p.maxItems || 6)}</p>
        </div>
      )
    case 'gallery':
      return (
        <div>
          {!!p.title && <p className="text-sm font-semibold text-gray-700 mb-2">{String(p.title)}</p>}
          <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${Math.min(Number(p.columns) || 3, 4)}, 1fr)` }}>
            {Array.from({ length: Math.min(Number(p.columns) || 3, 6) }).map((_, i) => (
              <div key={i} className="bg-gray-100 aspect-square rounded" />
            ))}
          </div>
        </div>
      )
    case 'cta':
      return (
        <div className={`rounded-xl p-8 text-center ${p.background === 'dark' ? 'bg-sacred-900 text-white' : 'bg-yoga-50 text-sacred-900'}`}>
          <p className="font-heading font-bold text-lg">{String(p.title || 'Call to Action')}</p>
          {!!p.subtitle && <p className="text-sm opacity-70 mt-1">{String(p.subtitle)}</p>}
          {!!p.buttonText && (
            <div className="inline-block mt-3 bg-yoga-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
              {String(p.buttonText)}
            </div>
          )}
        </div>
      )
    case 'quote':
      return (
        <div className="border-l-4 border-yoga-400 pl-4 py-2">
          <p className="text-sm text-gray-700 italic">{String(p.text || 'Your quote here...')}</p>
          {!!(p.author || p.source) && (
            <p className="text-xs text-gray-400 mt-1">
              — {String(p.author || '')} {p.source ? `· ${String(p.source)}` : ''}
            </p>
          )}
        </div>
      )
    case 'divider':
      return (
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-300">divider</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>
      )
    default:
      return <div className="text-xs text-gray-400">Unknown block type</div>
  }
}

// ── Block property editor ────────────────────────────────────────────────────

function PropInput({ label, value, onChange, type = 'text', placeholder = '', rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; rows?: number
}) {
  const cls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500'
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {type === 'textarea'
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder} className={`${cls} resize-none`} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      }
    </div>
  )
}

function PropSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function PropToggle({ label, value, onChange, description }: {
  label: string; value: boolean; onChange: (v: boolean) => void; description?: string
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)}
        className="mt-0.5 rounded border-gray-300 text-yoga-600 focus:ring-yoga-500" />
      <div>
        <span className="text-sm text-gray-700">{label}</span>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
    </label>
  )
}

function BlockEditor({ block, onChange }: { block: Block; onChange: (props: Record<string, unknown>) => void }) {
  const p = block.props
  const set = (key: string, value: unknown) => onChange({ ...p, [key]: value })
  const str = (key: string) => String(p[key] ?? '')
  const bool = (key: string) => Boolean(p[key])
  const num = (key: string, fallback = '') => String(p[key] ?? fallback)

  switch (block.type) {
    case 'hero':
      return (
        <div className="space-y-3">
          <PropInput label="Headline" value={str('title')} onChange={v => set('title', v)} placeholder="Welcome to Sacred Vibes" />
          <PropInput label="Subtitle" value={str('subtitle')} onChange={v => set('subtitle', v)} placeholder="Optional tagline" />
          <PropInput label="Button Text" value={str('ctaText')} onChange={v => set('ctaText', v)} placeholder="Book Now" />
          <PropInput label="Button Link" value={str('ctaLink')} onChange={v => set('ctaLink', v)} placeholder="/booking" />
          <PropSelect label="Alignment" value={str('alignment')} onChange={v => set('alignment', v)}
            options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
          <PropSelect label="Background" value={str('background')} onChange={v => set('background', v)}
            options={[
              { value: 'gradient', label: 'Gradient' }, { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' }, { value: 'image', label: 'Image' },
            ]} />
        </div>
      )
    case 'heading':
      return (
        <div className="space-y-3">
          <PropInput label="Heading Text" value={str('text')} onChange={v => set('text', v)} placeholder="Section Title" />
          <PropSelect label="Heading Level" value={str('level')} onChange={v => set('level', v)}
            options={[{ value: 'h1', label: 'H1 — Page Title' }, { value: 'h2', label: 'H2 — Section' }, { value: 'h3', label: 'H3 — Subsection' }]} />
          <PropSelect label="Alignment" value={str('alignment')} onChange={v => set('alignment', v)}
            options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
        </div>
      )
    case 'text':
      return (
        <div className="space-y-3">
          <PropInput label="Content" value={str('content')} onChange={v => set('content', v)} type="textarea" rows={6} placeholder="Your text here..." />
          <PropSelect label="Alignment" value={str('alignment')} onChange={v => set('alignment', v)}
            options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
        </div>
      )
    case 'image':
      return (
        <div className="space-y-3">
          <PropInput label="Image URL" value={str('src')} onChange={v => set('src', v)} placeholder="https://..." />
          <PropInput label="Alt Text" value={str('alt')} onChange={v => set('alt', v)} placeholder="Describe the image" />
          <PropInput label="Caption" value={str('caption')} onChange={v => set('caption', v)} placeholder="Optional caption" />
          <PropSelect label="Width" value={str('width')} onChange={v => set('width', v)}
            options={[{ value: 'full', label: 'Full width' }, { value: 'large', label: 'Large' }, { value: 'medium', label: 'Medium' }]} />
        </div>
      )
    case 'two-column':
      return (
        <div className="space-y-3">
          <PropInput label="Left Column" value={str('leftContent')} onChange={v => set('leftContent', v)} type="textarea" rows={4} />
          <PropInput label="Right Column" value={str('rightContent')} onChange={v => set('rightContent', v)} type="textarea" rows={4} />
          <PropSelect label="Split" value={str('leftWidth')} onChange={v => set('leftWidth', v)}
            options={[{ value: '1/2', label: '50 / 50' }, { value: '1/3', label: '33 / 67' }, { value: '2/3', label: '67 / 33' }]} />
        </div>
      )
    case 'services':
      return (
        <div className="space-y-3">
          <PropInput label="Section Title" value={str('title')} onChange={v => set('title', v)} placeholder="Our Services" />
          <PropInput label="Max Items" value={num('maxItems', '6')} onChange={v => set('maxItems', parseInt(v) || 6)} type="number" />
        </div>
      )
    case 'events':
      return (
        <div className="space-y-3">
          <PropInput label="Section Title" value={str('title')} onChange={v => set('title', v)} placeholder="Upcoming Events" />
          <PropInput label="Max Items" value={num('maxItems', '6')} onChange={v => set('maxItems', parseInt(v) || 6)} type="number" />
          <PropToggle label="Upcoming only" value={bool('upcomingOnly')} onChange={v => set('upcomingOnly', v)}
            description="Hide past events" />
        </div>
      )
    case 'gallery':
      return (
        <div className="space-y-3">
          <PropInput label="Section Title" value={str('title')} onChange={v => set('title', v)} placeholder="Optional title" />
          <PropSelect label="Columns" value={num('columns', '3')} onChange={v => set('columns', parseInt(v) || 3)}
            options={[{ value: '2', label: '2 columns' }, { value: '3', label: '3 columns' }, { value: '4', label: '4 columns' }]} />
          <PropInput label="Max Photos" value={num('maxItems', '12')} onChange={v => set('maxItems', parseInt(v) || 12)} type="number" />
        </div>
      )
    case 'cta':
      return (
        <div className="space-y-3">
          <PropInput label="Headline" value={str('title')} onChange={v => set('title', v)} placeholder="Ready to begin?" />
          <PropInput label="Subtitle" value={str('subtitle')} onChange={v => set('subtitle', v)} placeholder="Optional supporting text" />
          <PropInput label="Button Text" value={str('buttonText')} onChange={v => set('buttonText', v)} placeholder="Book Now" />
          <PropInput label="Button Link" value={str('buttonLink')} onChange={v => set('buttonLink', v)} placeholder="/booking" />
          <PropSelect label="Background" value={str('background')} onChange={v => set('background', v)}
            options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }, { value: 'accent', label: 'Accent' }]} />
        </div>
      )
    case 'quote':
      return (
        <div className="space-y-3">
          <PropInput label="Quote Text" value={str('text')} onChange={v => set('text', v)} type="textarea" rows={3} placeholder="Inspiring words..." />
          <PropInput label="Author" value={str('author')} onChange={v => set('author', v)} placeholder="Name" />
          <PropInput label="Source" value={str('source')} onChange={v => set('source', v)} placeholder="Book title, publication, etc." />
        </div>
      )
    case 'divider':
      return (
        <PropSelect label="Spacing" value={str('spacing')} onChange={v => set('spacing', v)}
          options={[{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }]} />
      )
    default:
      return <p className="text-xs text-gray-400">No properties available</p>
  }
}

// ── Draggable block row ──────────────────────────────────────────────────────

function DraggableBlock({
  block, isSelected, onSelect, onDelete,
}: {
  block: Block
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const controls = useDragControls()
  const palette = BLOCK_PALETTE.find(b => b.type === block.type)
  const Icon = palette?.icon ?? AlignLeft

  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={controls}
      className={`group relative bg-white border-2 rounded-xl transition-all cursor-pointer ${
        isSelected ? 'border-yoga-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
      layout
    >
      {/* Block header */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-t-xl ${isSelected ? 'bg-yoga-50' : 'bg-gray-50'} border-b border-inherit`}>
        <button
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none"
          onPointerDown={e => { e.stopPropagation(); controls.start(e) }}
        >
          <GripVertical size={14} />
        </button>
        <Icon size={13} className={isSelected ? 'text-yoga-600' : 'text-gray-400'} />
        <span className={`text-xs font-medium ${isSelected ? 'text-yoga-700' : 'text-gray-500'}`}>
          {palette?.label ?? block.type}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="ml-auto text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          title="Remove block"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Preview */}
      <div className="p-4 pointer-events-none select-none">
        <BlockPreview block={block} />
      </div>
    </Reorder.Item>
  )
}

// ── Main page builder ────────────────────────────────────────────────────────

export default function PageBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()

  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addPanelOpen, setAddPanelOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const { data: page, isLoading } = useQuery({
    queryKey: ['admin-page', id],
    queryFn: () => pagesApi.getPage(id).then(r => r.data.data!),
  })

  // Hydrate blocks from saved contentJson once
  useEffect(() => {
    if (!page) return
    if (page.contentJson) {
      try {
        const parsed = JSON.parse(page.contentJson)
        if (Array.isArray(parsed)) {
          setBlocks(parsed)
          return
        }
      } catch { /* ignore */ }
    }
    setBlocks([])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.id])

  const saveMutation = useMutation({
    mutationFn: (contentJson: string) => pagesApi.updatePage(id, { ...(page as object), contentJson }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-page', id] })
      qc.invalidateQueries({ queryKey: ['admin-pages'] })
      toast.success('Page saved')
      setIsDirty(false)
    },
    onError: () => toast.error('Failed to save'),
  })

  const publishMutation = useMutation({
    mutationFn: (contentJson: string) => pagesApi.updatePage(id, { ...(page as object), status: 'Published', contentJson }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-page', id] })
      toast.success('Page published')
      setIsDirty(false)
    },
    onError: () => toast.error('Failed to publish'),
  })

  const selectedBlock = blocks.find(b => b.id === selectedId) ?? null

  const addBlock = useCallback((type: BlockType) => {
    const newBlock: Block = { id: uid(), type, props: defaultProps(type) }
    setBlocks(prev => [...prev, newBlock])
    setSelectedId(newBlock.id)
    setAddPanelOpen(false)
    setIsDirty(true)
  }, [])

  const updateBlockProps = useCallback((blockId: string, props: Record<string, unknown>) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, props } : b))
    setIsDirty(true)
  }, [])

  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId))
    if (selectedId === blockId) setSelectedId(null)
    setIsDirty(true)
  }, [selectedId])

  const handleReorder = (newOrder: Block[]) => {
    setBlocks(newOrder)
    setIsDirty(true)
  }

  const handleSave = () => saveMutation.mutate(JSON.stringify(blocks))
  const handlePublish = () => publishMutation.mutate(JSON.stringify(blocks))

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
        Loading page builder...
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-100 overflow-hidden">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-3 shrink-0 shadow-sm z-10">
        <button
          onClick={() => router.push('/admin/pages')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Pages
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <div className="flex-1 min-w-0">
          <span className="font-semibold text-gray-900 text-sm truncate">{page?.title}</span>
          <span className="text-gray-400 text-xs ml-2">/{page?.slug}</span>
        </div>

        {isDirty && (
          <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
            Unsaved changes
          </span>
        )}

        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          page?.status === 'Published' ? 'bg-green-100 text-green-700' :
          page?.status === 'Draft' ? 'bg-yellow-100 text-yellow-600' :
          'bg-gray-100 text-gray-500'
        }`}>
          {page?.status}
        </span>

        <button
          onClick={handleSave}
          disabled={saveMutation.isPending || !isDirty}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          <Save size={14} />
          Save
        </button>

        <button
          onClick={handlePublish}
          disabled={publishMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-yoga-700 text-white text-sm rounded-lg hover:bg-yoga-800 disabled:opacity-50 transition-colors font-medium"
        >
          <Globe size={14} />
          Publish
        </button>
      </div>

      {/* Main editor area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: block palette */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Add Blocks</p>
            <p className="text-xs text-gray-400">Click a block to add it to your page</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {BLOCK_PALETTE.map(({ type, label, icon: Icon, description }) => (
              <button
                key={type}
                onClick={() => addBlock(type)}
                className="w-full text-left flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-yoga-300 hover:bg-yoga-50 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-yoga-100 flex items-center justify-center shrink-0 transition-colors">
                  <Icon size={15} className="text-gray-500 group-hover:text-yoga-700" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 group-hover:text-yoga-800">{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center: canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            {blocks.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Plus size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-1">Start building your page</h3>
                <p className="text-sm text-gray-400 mb-6">Pick a block from the left panel to add content to your page.</p>
                <button
                  onClick={() => addBlock('hero')}
                  className="px-5 py-2.5 bg-yoga-700 text-white rounded-xl text-sm font-medium hover:bg-yoga-800 transition-colors"
                >
                  Add a Hero block
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Reorder.Group
                  axis="y"
                  values={blocks}
                  onReorder={handleReorder}
                  className="space-y-3"
                >
                  {blocks.map(block => (
                    <DraggableBlock
                      key={block.id}
                      block={block}
                      isSelected={selectedId === block.id}
                      onSelect={() => setSelectedId(selectedId === block.id ? null : block.id)}
                      onDelete={() => deleteBlock(block.id)}
                    />
                  ))}
                </Reorder.Group>

                {/* Add block button at bottom */}
                <button
                  onClick={() => setAddPanelOpen(o => !o)}
                  className="w-full py-3 flex items-center justify-center gap-2 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl hover:border-yoga-300 hover:text-yoga-600 transition-colors"
                >
                  <Plus size={16} />
                  Add another block
                  {addPanelOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {addPanelOpen && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-2 gap-2">
                    {BLOCK_PALETTE.map(({ type, label, icon: Icon }) => (
                      <button
                        key={type}
                        onClick={() => addBlock(type)}
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 hover:border-yoga-300 hover:bg-yoga-50 transition-colors text-left"
                      >
                        <Icon size={14} className="text-gray-400 shrink-0" />
                        <span className="text-xs font-medium text-gray-700">{label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: properties panel */}
        <div className="w-72 bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-hidden">
          {selectedBlock ? (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {BLOCK_PALETTE.find(b => b.type === selectedBlock.type)?.label ?? selectedBlock.type}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Edit block properties</p>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-gray-300 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <BlockEditor
                  block={selectedBlock}
                  onChange={props => updateBlockProps(selectedBlock.id, props)}
                />
              </div>
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => deleteBlock(selectedBlock.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Remove block
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                <AlignLeft size={20} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No block selected</p>
              <p className="text-xs text-gray-400 mt-1">Click a block on the canvas to edit its properties</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
