'use client'

import { useState, useCallback, useEffect, use } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Reorder, useDragControls } from 'framer-motion'
import {
  ArrowLeft, Save, Globe, Plus, Trash2, GripVertical,
  Type, ImageIcon, AlignLeft, Columns2, Zap, Minus, Quote, Grid2x2,
  Star, CalendarDays, ShoppingBag, PanelRight, PanelRightClose,
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
  { type: 'hero',       label: 'Hero',         icon: Star,         description: 'Full-width banner with headline and CTA' },
  { type: 'heading',    label: 'Heading',      icon: Type,         description: 'Section title with gold accent' },
  { type: 'text',       label: 'Text',         icon: AlignLeft,    description: 'Paragraph block' },
  { type: 'image',      label: 'Image',        icon: ImageIcon,    description: 'Full-width or inset image' },
  { type: 'two-column', label: 'Two Column',   icon: Columns2,     description: 'Side-by-side content' },
  { type: 'services',   label: 'Services',     icon: ShoppingBag,  description: 'Service offerings grid' },
  { type: 'events',     label: 'Events',       icon: CalendarDays, description: 'Upcoming events list' },
  { type: 'gallery',    label: 'Gallery',      icon: Grid2x2,      description: 'Photo gallery grid' },
  { type: 'cta',        label: 'Call to Action', icon: Zap,        description: 'Action-prompting banner' },
  { type: 'quote',      label: 'Quote',        icon: Quote,        description: 'Blockquote with attribution' },
  { type: 'divider',    label: 'Divider',      icon: Minus,        description: 'Horizontal separator' },
]

function defaultProps(type: BlockType): Record<string, unknown> {
  switch (type) {
    case 'hero':       return { title: 'Welcome to Sacred Vibes', subtitle: 'Move. Breathe. Heal. Thrive.', ctaText: 'Book a Session', ctaLink: '/booking', ctaSecondaryText: '', ctaSecondaryLink: '', alignment: 'center', background: 'dark' }
    case 'heading':    return { eyebrow: '', text: 'Section Title', subheading: '', alignment: 'center' }
    case 'text':       return { content: 'Add your text here. This is where your message goes — share your story, describe your offerings, or provide details about your practice.', alignment: 'left' }
    case 'image':      return { src: '', alt: '', caption: '', width: 'full' }
    case 'two-column': return { leftContent: 'Left column text goes here.', rightContent: 'Right column text goes here.', leftWidth: '1/2' }
    case 'services':   return { eyebrow: 'What We Offer', title: 'Our Services', subheading: '', maxItems: 6 }
    case 'events':     return { eyebrow: 'Join Us', title: 'Upcoming Events', subheading: '', maxItems: 6, upcomingOnly: true }
    case 'gallery':    return { title: '', maxItems: 12, columns: 3 }
    case 'cta':        return { eyebrow: '', title: 'Ready to begin your journey?', subtitle: 'Join our community of healers and seekers.', buttonText: 'Book Now', buttonLink: '/booking', buttonSecondaryText: '', buttonSecondaryLink: '', background: 'dark' }
    case 'quote':      return { text: '', author: '', source: '' }
    case 'divider':    return { spacing: 'md', style: 'line' }
    default:           return {}
  }
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

const str = (p: Record<string, unknown>, key: string, fallback = '') =>
  String(p[key] ?? fallback)

const bool = (p: Record<string, unknown>, key: string) => Boolean(p[key])

// ── Full visual block renderer (matches real site output) ────────────────────

function BlockRenderer({ block }: { block: Block }) {
  const p = block.props

  switch (block.type) {

    case 'hero':
      return (
        <section className="relative min-h-[560px] flex items-center overflow-hidden bg-sacred-900">
          {/* Atmospheric gradient */}
          <div className="absolute inset-0">
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, #1c1714 0%, #2a1e18 35%, #1f1a16 65%, #161210 100%)'
            }} />
            <div className="absolute w-[600px] h-[600px] rounded-full blur-3xl"
              style={{ top: '-120px', right: '-150px', backgroundColor: 'rgba(139,109,56,0.12)' }} />
            <div className="absolute w-[400px] h-[400px] rounded-full blur-3xl"
              style={{ bottom: '-80px', left: '-100px', backgroundColor: 'rgba(139,109,56,0.09)' }} />
          </div>
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.4) 100%)' }} />

          <div className="relative z-10 w-full px-8 py-24">
            <div className={`max-w-4xl ${str(p, 'alignment') === 'left' ? '' : 'mx-auto text-center'}`}>
              <h1 className="font-heading text-4xl md:text-6xl text-white leading-tight mb-6">
                {str(p, 'title', 'Hero Headline')}
              </h1>
              <span className={`block w-16 h-0.5 bg-yoga-400 mb-6 ${str(p, 'alignment') !== 'left' ? 'mx-auto' : ''}`} />
              {!!p.subtitle && (
                <p className="text-base text-white/70 leading-relaxed mb-10 uppercase tracking-widest font-light">
                  {str(p, 'subtitle')}
                </p>
              )}
              <div className={`flex flex-wrap gap-4 ${str(p, 'alignment') !== 'left' ? 'justify-center' : ''}`}>
                {!!p.ctaText && (
                  <span className="inline-block bg-yoga-600 text-white text-sm font-semibold px-7 py-3 rounded-sm tracking-wide">
                    {str(p, 'ctaText')}
                  </span>
                )}
                {!!p.ctaSecondaryText && (
                  <span className="inline-block border border-white/40 text-white text-sm font-semibold px-7 py-3 rounded-sm tracking-wide">
                    {str(p, 'ctaSecondaryText')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )

    case 'heading':
      return (
        <section className="py-16 px-8 bg-white">
          <div className={`max-w-2xl ${str(p, 'alignment') !== 'left' ? 'mx-auto text-center' : ''}`}>
            {!!p.eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yoga-600 mb-4">
                {str(p, 'eyebrow')}
              </p>
            )}
            <h2 className="font-heading text-3xl md:text-4xl text-sacred-900 leading-tight mb-4">
              {str(p, 'text', 'Section Title')}
            </h2>
            <span className={`block w-14 h-0.5 bg-yoga-400 mb-5 ${str(p, 'alignment') !== 'left' ? 'mx-auto' : ''}`} />
            {!!p.subheading && (
              <p className="text-base text-sacred-500 font-light leading-relaxed tracking-wide">
                {str(p, 'subheading')}
              </p>
            )}
          </div>
        </section>
      )

    case 'text':
      return (
        <section className={`py-12 px-8 bg-white ${str(p, 'alignment') === 'center' ? 'text-center' : ''}`}>
          <div className="max-w-3xl mx-auto">
            <p className="text-base text-sacred-600 leading-relaxed font-light">
              {str(p, 'content', 'Text content...')}
            </p>
          </div>
        </section>
      )

    case 'image':
      return (
        <section className="bg-white py-8">
          <div className={
            str(p, 'width') === 'full' ? 'w-full' :
            str(p, 'width') === 'large' ? 'max-w-5xl mx-auto px-8' :
            'max-w-3xl mx-auto px-8'
          }>
            {p.src ? (
              <img src={str(p, 'src')} alt={str(p, 'alt')} className="w-full object-cover rounded-lg" />
            ) : (
              <div className="w-full h-64 bg-sacred-100 rounded-lg flex flex-col items-center justify-center gap-3 border-2 border-dashed border-sacred-200">
                <ImageIcon size={32} className="text-sacred-300" />
                <p className="text-sm text-sacred-400">No image set — add an image URL in the properties panel</p>
              </div>
            )}
            {!!p.caption && (
              <p className="text-center text-sm text-sacred-400 mt-3 italic">{str(p, 'caption')}</p>
            )}
          </div>
        </section>
      )

    case 'two-column': {
      const split = str(p, 'leftWidth', '1/2')
      const leftCols = split === '1/3' ? 'col-span-1' : split === '2/3' ? 'col-span-2' : 'col-span-1'
      const rightCols = split === '1/3' ? 'col-span-2' : split === '2/3' ? 'col-span-1' : 'col-span-1'
      return (
        <section className="py-16 px-8 bg-white">
          <div className={`max-w-5xl mx-auto grid ${split === '1/2' ? 'grid-cols-2' : 'grid-cols-3'} gap-12 items-start`}>
            <div className={leftCols}>
              <p className="text-base text-sacred-600 font-light leading-relaxed">
                {str(p, 'leftContent', 'Left column content')}
              </p>
            </div>
            <div className={rightCols}>
              <p className="text-base text-sacred-600 font-light leading-relaxed">
                {str(p, 'rightContent', 'Right column content')}
              </p>
            </div>
          </div>
        </section>
      )
    }

    case 'services':
      return (
        <section className="py-20 px-8 bg-sacred-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              {!!p.eyebrow && (
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yoga-600 mb-4">{str(p, 'eyebrow')}</p>
              )}
              <h2 className="font-heading text-3xl text-sacred-900 mb-3">{str(p, 'title', 'Our Services')}</h2>
              <span className="block w-14 h-0.5 bg-yoga-400 mx-auto" />
              {!!p.subheading && <p className="text-sacred-500 mt-4 font-light">{str(p, 'subheading')}</p>}
            </div>
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-sacred-100">
                  <div className="w-10 h-10 rounded-full bg-yoga-100 mb-4" />
                  <div className="h-3 bg-sacred-200 rounded w-2/3 mb-2" />
                  <div className="h-2 bg-sacred-100 rounded w-full mb-1" />
                  <div className="h-2 bg-sacred-100 rounded w-4/5" />
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-sacred-400 mt-6">Showing up to {str(p, 'maxItems', '6')} services from the database</p>
          </div>
        </section>
      )

    case 'events':
      return (
        <section className="py-20 px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              {!!p.eyebrow && (
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yoga-600 mb-4">{str(p, 'eyebrow')}</p>
              )}
              <h2 className="font-heading text-3xl text-sacred-900 mb-3">{str(p, 'title', 'Upcoming Events')}</h2>
              <span className="block w-14 h-0.5 bg-yoga-400 mx-auto" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-6 p-6 bg-sacred-50 rounded-xl border border-sacred-100">
                  <div className="w-16 h-16 bg-yoga-100 rounded-xl shrink-0 flex flex-col items-center justify-center">
                    <div className="h-2 bg-yoga-300 rounded w-8 mb-1" />
                    <div className="h-3 bg-yoga-400 rounded w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="h-3 bg-sacred-200 rounded w-1/2 mb-2" />
                    <div className="h-2 bg-sacred-100 rounded w-3/4 mb-1" />
                    <div className="h-2 bg-sacred-100 rounded w-1/3" />
                  </div>
                  <div className="w-24 h-8 bg-yoga-600 rounded self-center shrink-0" />
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-sacred-400 mt-6">
              {bool(p, 'upcomingOnly') ? 'Upcoming events only' : 'All events'} · up to {str(p, 'maxItems', '6')} items
            </p>
          </div>
        </section>
      )

    case 'gallery':
      return (
        <section className="py-16 px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            {!!p.title && (
              <h2 className="font-heading text-3xl text-sacred-900 text-center mb-10">{str(p, 'title')}</h2>
            )}
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(Number(p.columns) || 3, 4)}, 1fr)` }}>
              {Array.from({ length: Math.min(Number(p.columns) || 3, 9) }).map((_, i) => (
                <div key={i} className="aspect-square bg-sacred-100 rounded-lg" />
              ))}
            </div>
            <p className="text-center text-xs text-sacred-400 mt-4">Up to {str(p, 'maxItems', '12')} photos from the gallery</p>
          </div>
        </section>
      )

    case 'cta':
      return (
        <section className={`py-24 px-8 ${str(p, 'background') === 'dark' ? 'bg-sacred-900' : str(p, 'background') === 'accent' ? 'bg-yoga-700' : 'bg-sacred-50'}`}>
          <div className="max-w-3xl mx-auto text-center">
            {!!p.eyebrow && (
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-6 ${str(p, 'background') !== 'light' ? 'text-yoga-300' : 'text-yoga-600'}`}>
                {str(p, 'eyebrow')}
              </p>
            )}
            <h2 className={`font-heading text-3xl md:text-4xl leading-tight mb-4 ${str(p, 'background') !== 'light' ? 'text-white' : 'text-sacred-900'}`}>
              {str(p, 'title', 'Ready to begin?')}
            </h2>
            <span className="block w-16 h-0.5 bg-yoga-400 mx-auto mb-6" />
            {!!p.subtitle && (
              <p className={`text-base font-light mb-10 ${str(p, 'background') !== 'light' ? 'text-white/70' : 'text-sacred-500'}`}>
                {str(p, 'subtitle')}
              </p>
            )}
            <div className="flex flex-wrap gap-4 justify-center">
              {!!p.buttonText && (
                <span className="inline-block bg-yoga-600 text-white text-sm font-semibold px-8 py-3 rounded-sm tracking-wide">
                  {str(p, 'buttonText')}
                </span>
              )}
              {!!p.buttonSecondaryText && (
                <span className="inline-block border border-white/40 text-white text-sm font-semibold px-8 py-3 rounded-sm tracking-wide">
                  {str(p, 'buttonSecondaryText')}
                </span>
              )}
            </div>
          </div>
        </section>
      )

    case 'quote':
      return (
        <section className="py-20 px-8 bg-sacred-50">
          <div className="max-w-3xl mx-auto text-center">
            <span className="block w-12 h-0.5 bg-yoga-400 mx-auto mb-8" />
            <blockquote className="font-heading text-2xl md:text-3xl text-sacred-800 leading-relaxed italic mb-6">
              &ldquo;{str(p, 'text', 'Your inspiring quote goes here...')}&rdquo;
            </blockquote>
            {!!(p.author || p.source) && (
              <p className="text-sm text-sacred-400 uppercase tracking-widest">
                — {str(p, 'author')} {p.source ? `· ${str(p, 'source')}` : ''}
              </p>
            )}
            <span className="block w-12 h-0.5 bg-yoga-400 mx-auto mt-8" />
          </div>
        </section>
      )

    case 'divider': {
      const spacing = str(p, 'spacing', 'md') === 'sm' ? 'py-6' : str(p, 'spacing') === 'lg' ? 'py-16' : 'py-10'
      return (
        <div className={`${spacing} px-8 bg-white`}>
          <div className="max-w-6xl mx-auto flex items-center gap-6">
            <div className="flex-1 h-px bg-sacred-100" />
            <span className="w-1.5 h-1.5 rounded-full bg-yoga-400 shrink-0" />
            <div className="flex-1 h-px bg-sacred-100" />
          </div>
        </div>
      )
    }

    default:
      return <div className="py-8 px-8 text-center text-sacred-400 text-sm">Unknown block type</div>
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
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
    </label>
  )
}

function BlockEditor({ block, onChange }: { block: Block; onChange: (props: Record<string, unknown>) => void }) {
  const p = block.props
  const set = (key: string, value: unknown) => onChange({ ...p, [key]: value })
  const s = (key: string, fb = '') => str(p, key, fb)
  const b = (key: string) => bool(p, key)

  switch (block.type) {
    case 'hero':
      return (
        <div className="space-y-3">
          <PropInput label="Headline" value={s('title')} onChange={v => set('title', v)} placeholder="Welcome to Sacred Vibes" />
          <PropInput label="Subtitle" value={s('subtitle')} onChange={v => set('subtitle', v)} placeholder="Move. Breathe. Heal. Thrive." />
          <PropInput label="Primary Button Text" value={s('ctaText')} onChange={v => set('ctaText', v)} placeholder="Book a Session" />
          <PropInput label="Primary Button Link" value={s('ctaLink')} onChange={v => set('ctaLink', v)} placeholder="/booking" />
          <PropInput label="Secondary Button Text" value={s('ctaSecondaryText')} onChange={v => set('ctaSecondaryText', v)} placeholder="Learn More" />
          <PropInput label="Secondary Button Link" value={s('ctaSecondaryLink')} onChange={v => set('ctaSecondaryLink', v)} placeholder="/about" />
          <PropSelect label="Text Alignment" value={s('alignment', 'center')} onChange={v => set('alignment', v)}
            options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centered' }]} />
        </div>
      )
    case 'heading':
      return (
        <div className="space-y-3">
          <PropInput label="Eyebrow Text" value={s('eyebrow')} onChange={v => set('eyebrow', v)} placeholder="What We Offer" />
          <PropInput label="Heading" value={s('text')} onChange={v => set('text', v)} placeholder="Section Title" />
          <PropInput label="Subheading" value={s('subheading')} onChange={v => set('subheading', v)} placeholder="Supporting description" />
          <PropSelect label="Alignment" value={s('alignment', 'center')} onChange={v => set('alignment', v)}
            options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centered' }]} />
        </div>
      )
    case 'text':
      return (
        <div className="space-y-3">
          <PropInput label="Content" value={s('content')} onChange={v => set('content', v)} type="textarea" rows={8} placeholder="Your text here..." />
          <PropSelect label="Alignment" value={s('alignment', 'left')} onChange={v => set('alignment', v)}
            options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }]} />
        </div>
      )
    case 'image':
      return (
        <div className="space-y-3">
          <PropInput label="Image URL" value={s('src')} onChange={v => set('src', v)} placeholder="https://..." />
          <PropInput label="Alt Text" value={s('alt')} onChange={v => set('alt', v)} placeholder="Describe the image for accessibility" />
          <PropInput label="Caption" value={s('caption')} onChange={v => set('caption', v)} placeholder="Optional caption" />
          <PropSelect label="Width" value={s('width', 'full')} onChange={v => set('width', v)}
            options={[{ value: 'full', label: 'Full width' }, { value: 'large', label: 'Large (contained)' }, { value: 'medium', label: 'Medium' }]} />
        </div>
      )
    case 'two-column':
      return (
        <div className="space-y-3">
          <PropInput label="Left Column" value={s('leftContent')} onChange={v => set('leftContent', v)} type="textarea" rows={5} />
          <PropInput label="Right Column" value={s('rightContent')} onChange={v => set('rightContent', v)} type="textarea" rows={5} />
          <PropSelect label="Column Split" value={s('leftWidth', '1/2')} onChange={v => set('leftWidth', v)}
            options={[{ value: '1/2', label: '50 / 50' }, { value: '1/3', label: '33 / 67' }, { value: '2/3', label: '67 / 33' }]} />
        </div>
      )
    case 'services':
      return (
        <div className="space-y-3">
          <PropInput label="Eyebrow" value={s('eyebrow')} onChange={v => set('eyebrow', v)} placeholder="What We Offer" />
          <PropInput label="Section Title" value={s('title')} onChange={v => set('title', v)} placeholder="Our Services" />
          <PropInput label="Subheading" value={s('subheading')} onChange={v => set('subheading', v)} placeholder="" />
          <PropInput label="Max Items" value={s('maxItems', '6')} onChange={v => set('maxItems', parseInt(v) || 6)} type="number" />
        </div>
      )
    case 'events':
      return (
        <div className="space-y-3">
          <PropInput label="Eyebrow" value={s('eyebrow')} onChange={v => set('eyebrow', v)} placeholder="Join Us" />
          <PropInput label="Section Title" value={s('title')} onChange={v => set('title', v)} placeholder="Upcoming Events" />
          <PropInput label="Subheading" value={s('subheading')} onChange={v => set('subheading', v)} placeholder="" />
          <PropInput label="Max Items" value={s('maxItems', '6')} onChange={v => set('maxItems', parseInt(v) || 6)} type="number" />
          <PropToggle label="Upcoming events only" value={b('upcomingOnly')} onChange={v => set('upcomingOnly', v)} description="Hide past events" />
        </div>
      )
    case 'gallery':
      return (
        <div className="space-y-3">
          <PropInput label="Section Title" value={s('title')} onChange={v => set('title', v)} placeholder="Optional title" />
          <PropSelect label="Columns" value={s('columns', '3')} onChange={v => set('columns', parseInt(v) || 3)}
            options={[{ value: '2', label: '2 columns' }, { value: '3', label: '3 columns' }, { value: '4', label: '4 columns' }]} />
          <PropInput label="Max Photos" value={s('maxItems', '12')} onChange={v => set('maxItems', parseInt(v) || 12)} type="number" />
        </div>
      )
    case 'cta':
      return (
        <div className="space-y-3">
          <PropInput label="Eyebrow" value={s('eyebrow')} onChange={v => set('eyebrow', v)} placeholder="" />
          <PropInput label="Headline" value={s('title')} onChange={v => set('title', v)} placeholder="Ready to begin your journey?" />
          <PropInput label="Subtitle" value={s('subtitle')} onChange={v => set('subtitle', v)} placeholder="Supporting text" type="textarea" rows={2} />
          <PropInput label="Primary Button Text" value={s('buttonText')} onChange={v => set('buttonText', v)} placeholder="Book Now" />
          <PropInput label="Primary Button Link" value={s('buttonLink')} onChange={v => set('buttonLink', v)} placeholder="/booking" />
          <PropInput label="Secondary Button Text" value={s('buttonSecondaryText')} onChange={v => set('buttonSecondaryText', v)} placeholder="" />
          <PropInput label="Secondary Button Link" value={s('buttonSecondaryLink')} onChange={v => set('buttonSecondaryLink', v)} placeholder="" />
          <PropSelect label="Background" value={s('background', 'dark')} onChange={v => set('background', v)}
            options={[{ value: 'dark', label: 'Dark (sacred-900)' }, { value: 'light', label: 'Light' }, { value: 'accent', label: 'Gold accent' }]} />
        </div>
      )
    case 'quote':
      return (
        <div className="space-y-3">
          <PropInput label="Quote Text" value={s('text')} onChange={v => set('text', v)} type="textarea" rows={4} placeholder="Inspiring words..." />
          <PropInput label="Author" value={s('author')} onChange={v => set('author', v)} placeholder="Name" />
          <PropInput label="Source" value={s('source')} onChange={v => set('source', v)} placeholder="Book, publication, etc." />
        </div>
      )
    case 'divider':
      return (
        <div className="space-y-3">
          <PropSelect label="Spacing" value={s('spacing', 'md')} onChange={v => set('spacing', v)}
            options={[{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }]} />
        </div>
      )
    default:
      return <p className="text-xs text-gray-400">No properties available</p>
  }
}

// ── Draggable canvas block ───────────────────────────────────────────────────

function CanvasBlock({
  block, isSelected, onSelect, onDelete,
}: {
  block: Block
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const controls = useDragControls()
  const palette = BLOCK_PALETTE.find(b => b.type === block.type)

  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={controls}
      layout
      className="relative group"
    >
      {/* Selection ring */}
      <div
        className={`absolute inset-0 z-10 rounded-none pointer-events-none transition-all ${
          isSelected ? 'ring-2 ring-yoga-500 ring-inset' : 'ring-0 group-hover:ring-1 group-hover:ring-yoga-300 group-hover:ring-inset'
        }`}
      />

      {/* Floating toolbar — shown on hover/select */}
      <div className={`absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-sacred-900/90 text-white rounded-lg px-2 py-1 shadow-lg transition-all ${
        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <button
          className="cursor-grab active:cursor-grabbing p-1 hover:text-yoga-300 touch-none"
          onPointerDown={e => { e.stopPropagation(); controls.start(e) }}
          title="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
        <span className="text-xs text-white/60 px-1 border-x border-white/10">
          {palette?.label ?? block.type}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="p-1 hover:text-red-400 transition-colors"
          title="Remove block"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Actual rendered block — click to select */}
      <div onClick={onSelect} className="cursor-pointer">
        <BlockRenderer block={block} />
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
  const [isDirty, setIsDirty] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)

  const { data: page, isLoading } = useQuery({
    queryKey: ['admin-page', id],
    queryFn: () => pagesApi.getPage(id).then(r => r.data.data!),
  })

  useEffect(() => {
    if (!page) return
    if (page.contentJson) {
      try {
        const parsed = JSON.parse(page.contentJson)
        if (Array.isArray(parsed)) { setBlocks(parsed); return }
      } catch { /* ignore */ }
    }
    setBlocks([])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.id])

  const saveMutation = useMutation({
    mutationFn: (contentJson: string) =>
      pagesApi.updatePage(id, { ...(page as object), contentJson }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-page', id] })
      qc.invalidateQueries({ queryKey: ['admin-pages'] })
      toast.success('Page saved')
      setIsDirty(false)
    },
    onError: () => toast.error('Failed to save'),
  })

  const publishMutation = useMutation({
    mutationFn: (contentJson: string) =>
      pagesApi.updatePage(id, { ...(page as object), status: 'Published', contentJson }),
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
    setPanelOpen(true)
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

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
        Loading page builder...
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden">

      {/* ── Top bar ── */}
      <div className="bg-sacred-900 border-b border-sacred-800 h-14 flex items-center px-4 gap-3 shrink-0 z-20">
        <button
          onClick={() => router.push('/admin/pages')}
          className="flex items-center gap-1.5 text-sm text-sacred-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Pages</span>
        </button>

        <div className="w-px h-5 bg-sacred-700 mx-1" />

        <div className="flex-1 min-w-0">
          <span className="font-medium text-white text-sm truncate">{page?.title}</span>
          <span className="text-sacred-400 text-xs ml-2 font-mono">/{page?.slug}</span>
        </div>

        {isDirty && (
          <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full hidden sm:inline-flex">
            Unsaved
          </span>
        )}

        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          page?.status === 'Published' ? 'bg-green-500/20 text-green-300' :
          page?.status === 'Draft'     ? 'bg-yellow-500/20 text-yellow-300' :
          'bg-sacred-700 text-sacred-300'
        }`}>
          {page?.status}
        </span>

        <button
          onClick={() => saveMutation.mutate(JSON.stringify(blocks))}
          disabled={saveMutation.isPending || !isDirty}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-sacred-600 text-sacred-200 rounded-lg hover:bg-sacred-800 disabled:opacity-40 transition-colors"
        >
          <Save size={14} />
          Save
        </button>

        <button
          onClick={() => publishMutation.mutate(JSON.stringify(blocks))}
          disabled={publishMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-yoga-600 text-white text-sm rounded-lg hover:bg-yoga-700 disabled:opacity-50 transition-colors font-medium"
        >
          <Globe size={14} />
          Publish
        </button>

        <button
          onClick={() => setPanelOpen(o => !o)}
          className="ml-1 p-2 text-sacred-300 hover:text-white transition-colors"
          title={panelOpen ? 'Hide properties' : 'Show properties'}
        >
          {panelOpen ? <PanelRightClose size={18} /> : <PanelRight size={18} />}
        </button>
      </div>

      {/* ── Editor area ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Canvas — full-width page preview */}
        <div className="flex-1 overflow-y-auto bg-gray-200">

          {/* "Browser chrome" illusion */}
          <div className="sticky top-0 z-10 bg-gray-300 border-b border-gray-400 flex items-center px-4 py-2 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
              <div className="w-3 h-3 rounded-full bg-green-400/70" />
            </div>
            <div className="flex-1 mx-4 bg-white rounded-full px-4 py-1 text-xs text-gray-500 font-mono">
              sacredvibesyoga.com/{page?.slug}
            </div>
            <span className="text-xs text-gray-500">Preview</span>
          </div>

          {/* Page content */}
          <div className="bg-white min-h-screen shadow-2xl">
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center px-8">
                <div className="w-16 h-16 bg-sacred-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Plus size={28} className="text-sacred-300" />
                </div>
                <h3 className="text-xl font-heading text-sacred-700 mb-2">Your page is empty</h3>
                <p className="text-sacred-400 text-sm mb-8 max-w-xs">
                  Use the + button below to add your first block and start building your page.
                </p>
              </div>
            ) : (
              <Reorder.Group
                axis="y"
                values={blocks}
                onReorder={handleReorder}
              >
                {blocks.map(block => (
                  <CanvasBlock
                    key={block.id}
                    block={block}
                    isSelected={selectedId === block.id}
                    onSelect={() => setSelectedId(selectedId === block.id ? null : block.id)}
                    onDelete={() => deleteBlock(block.id)}
                  />
                ))}
              </Reorder.Group>
            )}

            {/* Add block button inline at bottom of page */}
            <div className="py-8 px-8">
              <AddBlockMenu onAdd={addBlock} />
            </div>
          </div>
        </div>

        {/* Right panel — properties + block picker */}
        {panelOpen && (
          <div className="w-72 bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-hidden">
            {selectedBlock ? (
              <>
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {BLOCK_PALETTE.find(b => b.type === selectedBlock.type)?.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Edit block content</p>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="text-gray-300 hover:text-gray-600">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <BlockEditor
                    block={selectedBlock}
                    onChange={props => updateBlockProps(selectedBlock.id, props)}
                  />
                </div>
                <div className="p-4 border-t border-gray-100 space-y-2">
                  <button
                    onClick={() => {
                      const idx = blocks.findIndex(b => b.id === selectedBlock.id)
                      if (idx > 0) {
                        const next = [...blocks]
                        ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
                        setBlocks(next); setIsDirty(true)
                      }
                    }}
                    className="w-full py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >↑ Move up</button>
                  <button
                    onClick={() => {
                      const idx = blocks.findIndex(b => b.id === selectedBlock.id)
                      if (idx < blocks.length - 1) {
                        const next = [...blocks]
                        ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
                        setBlocks(next); setIsDirty(true)
                      }
                    }}
                    className="w-full py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >↓ Move down</button>
                  <button
                    onClick={() => deleteBlock(selectedBlock.id)}
                    className="w-full py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 size={12} /> Remove block
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Add a Block</p>
                  <p className="text-xs text-gray-400 mt-1">Click any block to add it, then select it to edit</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                  {BLOCK_PALETTE.map(({ type, label, icon: Icon, description }) => (
                    <button
                      key={type}
                      onClick={() => addBlock(type)}
                      className="w-full text-left flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-yoga-300 hover:bg-yoga-50 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-yoga-100 flex items-center justify-center shrink-0 transition-colors">
                        <Icon size={14} className="text-gray-400 group-hover:text-yoga-700" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 group-hover:text-yoga-800">{label}</div>
                        <div className="text-xs text-gray-400">{description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Inline add-block menu ────────────────────────────────────────────────────

function AddBlockMenu({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl hover:border-yoga-400 hover:text-yoga-600 transition-colors"
      >
        <Plus size={16} />
        Add a block
      </button>
      {open && (
        <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-2 shadow-lg">
          {BLOCK_PALETTE.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => { onAdd(type); setOpen(false) }}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-yoga-300 hover:bg-yoga-50 transition-colors text-center"
            >
              <div className="w-9 h-9 rounded-lg bg-sacred-100 flex items-center justify-center">
                <Icon size={16} className="text-sacred-600" />
              </div>
              <span className="text-xs font-medium text-gray-700">{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
