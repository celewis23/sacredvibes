'use client'

import { useState, useEffect, useRef, useCallback, use } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Reorder, useDragControls } from 'framer-motion'
import {
  ArrowLeft, Save, Globe, Plus, Trash2, GripVertical, Settings2, X,
  Star, Type, AlignLeft, ImageIcon, Columns2, ShoppingBag,
  CalendarDays, Zap, Quote, Grid2x2, Minus,
} from 'lucide-react'
import { pagesApi } from '@/lib/api'
import type { SitePage } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type SectionType =
  | 'hero' | 'heading' | 'text' | 'image' | 'two-column'
  | 'services' | 'events' | 'gallery' | 'cta' | 'quote' | 'divider'

interface SectionStyle {
  bg: 'white' | 'soft' | 'dark' | 'accent'
  paddingY: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

interface Section {
  id: string
  type: SectionType
  content: Record<string, unknown>
  style: SectionStyle
}

// ── Section palette ───────────────────────────────────────────────────────────

const SECTION_PALETTE: { type: SectionType; label: string; icon: React.ElementType }[] = [
  { type: 'hero',       label: 'Hero',          icon: Star },
  { type: 'heading',    label: 'Heading',       icon: Type },
  { type: 'text',       label: 'Text',          icon: AlignLeft },
  { type: 'image',      label: 'Image',         icon: ImageIcon },
  { type: 'two-column', label: 'Two Column',    icon: Columns2 },
  { type: 'services',   label: 'Services',      icon: ShoppingBag },
  { type: 'events',     label: 'Events',        icon: CalendarDays },
  { type: 'gallery',    label: 'Gallery',       icon: Grid2x2 },
  { type: 'cta',        label: 'Call to Action',icon: Zap },
  { type: 'quote',      label: 'Quote',         icon: Quote },
  { type: 'divider',    label: 'Divider',       icon: Minus },
]

// ── Defaults & template presets ───────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10) }

function makeSection(type: SectionType, contentOverrides?: Record<string, unknown>, styleOverrides?: Partial<SectionStyle>): Section {
  const defaults: Record<SectionType, { content: Record<string, unknown>; style: SectionStyle }> = {
    hero:        { style: { bg: 'dark',  paddingY: 'xl' }, content: { headline: 'Your Headline Here', subheading: 'Supporting text that describes your offering.', ctaText: 'Book Now', ctaLink: '/booking', ctaSecondaryText: '', ctaSecondaryLink: '' } },
    heading:     { style: { bg: 'white', paddingY: 'lg' }, content: { eyebrow: 'Section Label', headline: 'Section Title', subheading: '' } },
    text:        { style: { bg: 'white', paddingY: 'md' }, content: { body: 'Add your text here. This is where your message goes — share your story, describe your offerings, or provide details about your practice.' } },
    image:       { style: { bg: 'white', paddingY: 'sm' }, content: { src: '', alt: '', caption: '' } },
    'two-column':{ style: { bg: 'white', paddingY: 'lg' }, content: { leftHeadline: '', leftBody: 'Left column content goes here.', rightHeadline: '', rightBody: 'Right column content goes here.' } },
    services:    { style: { bg: 'soft',  paddingY: 'xl' }, content: { eyebrow: 'What We Offer', headline: 'Our Services', subheading: '', maxItems: 6 } },
    events:      { style: { bg: 'white', paddingY: 'xl' }, content: { eyebrow: 'Join Us', headline: 'Upcoming Events', subheading: '', maxItems: 4, upcomingOnly: true } },
    gallery:     { style: { bg: 'white', paddingY: 'lg' }, content: { headline: '', columns: 3, maxItems: 12 } },
    cta:         { style: { bg: 'dark',  paddingY: 'xl' }, content: { eyebrow: '', headline: 'Ready to begin your journey?', subheading: 'Join our community of healers and seekers.', ctaText: 'Book Now', ctaLink: '/booking' } },
    quote:       { style: { bg: 'soft',  paddingY: 'xl' }, content: { text: 'Your inspiring quote goes here.', author: 'Name', source: '' } },
    divider:     { style: { bg: 'white', paddingY: 'sm' }, content: {} },
  }
  const d = defaults[type]
  return {
    id: uid(),
    type,
    content: { ...d.content, ...contentOverrides },
    style: { ...d.style, ...styleOverrides },
  }
}

function templateSections(template: string): Section[] {
  switch (template) {
    case 'home':
      return [
        makeSection('hero', { headline: 'Move. Breathe. Heal. Thrive.', subheading: 'Sacred Vibes offers yoga, massage, and sound healing in a community built on transformation.', ctaText: 'Explore Our Offerings', ctaLink: '/services', ctaSecondaryText: 'Book a Session', ctaSecondaryLink: '/booking' }),
        makeSection('services', { eyebrow: 'What We Offer', headline: 'Sacred Offerings', subheading: 'Choose the practice that calls to you.', maxItems: 6 }),
        makeSection('events',   { eyebrow: 'Join Us', headline: 'Upcoming Events', maxItems: 4, upcomingOnly: true }),
        makeSection('cta',      { headline: 'Ready to begin your journey?', subheading: 'Your transformation starts with a single step.', ctaText: 'Book a Session', ctaLink: '/booking' }),
      ]
    case 'sound-on-the-river':
      return [
        makeSection('hero',   { headline: 'Sound on the River', subheading: 'An immersive outdoor sound bath experience on the water.', ctaText: 'View Upcoming Dates', ctaLink: '/events', ctaSecondaryText: '', ctaSecondaryLink: '' }),
        makeSection('text',   { body: 'Describe the Sound on the River experience here — what attendees can expect, the setting, the instruments used, and why this experience is transformative.' }),
        makeSection('events', { eyebrow: 'Upcoming Dates', headline: 'Sound on the River', maxItems: 6, upcomingOnly: true }),
        makeSection('cta',    { headline: 'Reserve Your Spot', subheading: 'Limited capacity. Book early to secure your place.', ctaText: 'Book Now', ctaLink: '/booking' }),
      ]
    case 'contact':
      return [
        makeSection('hero', { headline: 'Get in Touch', subheading: "We'd love to hear from you.", ctaText: '', ctaLink: '' }, { paddingY: 'lg' }),
        makeSection('text', { body: 'Reach us at info@sacredvibesyoga.com or fill out the form below. We typically respond within 24 hours.' }),
      ]
    case 'gallery':
      return [
        makeSection('hero',    { headline: 'Gallery', subheading: 'Moments from our community.', ctaText: '', ctaLink: '' }, { paddingY: 'lg' }),
        makeSection('gallery', { headline: '', columns: 3, maxItems: 24 }),
      ]
    case 'booking':
      return [
        makeSection('hero', { headline: 'Book a Session', subheading: 'Choose your practice and schedule your next visit.', ctaText: '', ctaLink: '' }, { paddingY: 'lg' }),
        makeSection('services', { eyebrow: 'Available Services', headline: 'Choose Your Session', maxItems: 12 }),
      ]
    default:
      return [
        makeSection('hero', { headline: 'Page Title', subheading: '', ctaText: '', ctaLink: '' }, { paddingY: 'lg' }),
        makeSection('text'),
      ]
  }
}

// ── Style helpers ─────────────────────────────────────────────────────────────

function bgCls(bg: string) {
  return bg === 'dark' ? 'bg-sacred-900' : bg === 'soft' ? 'bg-sacred-50' : bg === 'accent' ? 'bg-yoga-700' : 'bg-white'
}
function pyCls(p: string) {
  return p === 'none' ? 'py-0' : p === 'sm' ? 'py-8' : p === 'md' ? 'py-12' : p === 'lg' ? 'py-16' : 'py-24'
}

// ── EditableText ──────────────────────────────────────────────────────────────

function EditableText({
  value, onChange, as: Tag = 'p', className = '', placeholder = 'Click to edit…',
}: {
  value: string; onChange: (v: string) => void
  as?: keyof React.JSX.IntrinsicElements; className?: string; placeholder?: string
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null)
  const committed = useRef(value)

  // Only sync DOM when value changes externally (not while user is typing)
  useEffect(() => {
    if (!ref.current) return
    if (document.activeElement === ref.current) return
    if (committed.current === value) return
    ref.current.innerText = value
    committed.current = value
  }, [value])

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={e => {
        const next = (e.currentTarget as HTMLElement).innerText
        committed.current = next
        onChange(next)
      }}
      className={`outline-none cursor-text empty:before:content-[attr(data-placeholder)] empty:before:opacity-30 ${className}`}
    />
  )
}

// ── EditableImage ─────────────────────────────────────────────────────────────

function EditableImage({ src, alt, caption, onChange }: {
  src: string; alt: string; caption: string
  onChange: (src: string, alt: string, caption: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({ src, alt, caption })

  return (
    <>
      <div className="group/img relative">
        {src ? (
          <img src={src} alt={alt} className="w-full object-cover rounded-lg" />
        ) : (
          <div onClick={() => { setDraft({ src, alt, caption }); setOpen(true) }}
            className="w-full h-64 bg-sacred-100 rounded-xl border-2 border-dashed border-sacred-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-sacred-50 transition-colors">
            <ImageIcon size={28} className="text-sacred-300" />
            <span className="text-sm text-sacred-400">Click to add image</span>
          </div>
        )}
        {src && (
          <button onClick={() => { setDraft({ src, alt, caption }); setOpen(true) }}
            className="absolute inset-0 rounded-lg flex items-center justify-center bg-black/0 hover:bg-black/30 opacity-0 group-hover/img:opacity-100 transition-all">
            <span className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <ImageIcon size={12} /> Replace image
            </span>
          </button>
        )}
        {caption && <p className="text-center text-sm text-sacred-400 mt-2 italic">{caption}</p>}
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Image</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {['Image URL:src', 'Alt text:alt', 'Caption:caption'].map(f => {
                const [label, key] = f.split(':')
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input value={draft[key as keyof typeof draft]}
                      onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                      placeholder={key === 'src' ? 'https://...' : ''} />
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setOpen(false)} className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={() => { onChange(draft.src, draft.alt, draft.caption); setOpen(false) }}
                className="flex-1 py-2 text-sm bg-yoga-700 text-white rounded-xl hover:bg-yoga-800 font-medium">Apply</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── EditableButton ────────────────────────────────────────────────────────────

function EditableButton({ text, link, secondary, onChange }: {
  text: string; link: string; secondary?: boolean
  onChange: (text: string, link: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({ text, link })

  if (!text) {
    return (
      <button onClick={() => { setDraft({ text: '', link: '' }); setOpen(true) }}
        className="text-xs text-white/30 border border-white/20 rounded-full px-4 py-1.5 hover:border-white/50 hover:text-white/50 transition-colors">
        + {secondary ? 'Add secondary button' : 'Add button'}
      </button>
    )
  }

  return (
    <>
      <span className="group/btn relative inline-block">
        <span onClick={() => { setDraft({ text, link }); setOpen(true) }}
          className={`inline-block text-sm font-semibold px-7 py-3 tracking-wide cursor-pointer select-none ${
            secondary
              ? 'border border-white/40 text-white hover:bg-white/10'
              : 'bg-yoga-600 text-white hover:bg-yoga-500'
          } transition-colors`}>
          {text}
        </span>
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/btn:opacity-100 pointer-events-none">
          Click to edit
        </span>
      </span>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Button</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Button text</label>
                <input value={draft.text} onChange={e => setDraft(d => ({ ...d, text: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Link URL</label>
                <input value={draft.link} onChange={e => setDraft(d => ({ ...d, link: e.target.value }))}
                  placeholder="/booking" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => { onChange('', ''); setOpen(false) }}
                className="py-2 px-3 text-xs text-red-500 border border-red-200 rounded-xl hover:bg-red-50">Remove</button>
              <button onClick={() => setOpen(false)} className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={() => { onChange(draft.text, draft.link); setOpen(false) }}
                className="flex-1 py-2 text-sm bg-yoga-700 text-white rounded-xl hover:bg-yoga-800 font-medium">Apply</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Section content renderers ─────────────────────────────────────────────────

function SectionContent({ section, onChange }: {
  section: Section; onChange: (c: Record<string, unknown>) => void
}) {
  const c = section.content
  const dark = section.style.bg === 'dark' || section.style.bg === 'accent'
  const set = (key: string, val: unknown) => onChange({ ...c, [key]: val })
  const txt = (key: string, fb = '') => String(c[key] ?? fb)

  switch (section.type) {
    case 'hero':
      return (
        <div className="relative max-w-4xl mx-auto px-8 text-center">
          {/* Ambient orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-15"
              style={{ top: '-100px', right: '-100px', backgroundColor: '#8B6D38' }} />
            <div className="absolute w-[350px] h-[350px] rounded-full blur-3xl opacity-10"
              style={{ bottom: '-60px', left: '-80px', backgroundColor: '#8B6D38' }} />
          </div>
          <div className="relative z-10">
            <EditableText value={txt('headline')} onChange={v => set('headline', v)}
              as="h1" placeholder="Your headline…"
              className="font-heading text-4xl md:text-6xl text-white leading-tight mb-4" />
            <span className="block w-16 h-0.5 bg-yoga-400 mx-auto mb-6" />
            <EditableText value={txt('subheading')} onChange={v => set('subheading', v)}
              as="p" placeholder="Supporting subheading…"
              className="text-base text-white/70 mb-10 uppercase tracking-widest font-light max-w-xl mx-auto" />
            <div className="flex flex-wrap gap-4 justify-center">
              <EditableButton text={txt('ctaText')} link={txt('ctaLink')}
                onChange={(t, l) => onChange({ ...c, ctaText: t, ctaLink: l })} />
              <EditableButton text={txt('ctaSecondaryText')} link={txt('ctaSecondaryLink')} secondary
                onChange={(t, l) => onChange({ ...c, ctaSecondaryText: t, ctaSecondaryLink: l })} />
            </div>
          </div>
        </div>
      )

    case 'heading':
      return (
        <div className="max-w-2xl mx-auto px-8 text-center">
          <EditableText value={txt('eyebrow')} onChange={v => set('eyebrow', v)}
            as="p" placeholder="Eyebrow label…"
            className={`text-xs font-semibold uppercase tracking-[0.2em] mb-4 ${dark ? 'text-yoga-300' : 'text-yoga-600'}`} />
          <EditableText value={txt('headline')} onChange={v => set('headline', v)}
            as="h2" placeholder="Section title…"
            className={`font-heading text-3xl md:text-4xl leading-tight mb-4 ${dark ? 'text-white' : 'text-sacred-900'}`} />
          <span className={`block w-14 h-0.5 bg-yoga-400 mx-auto mb-5`} />
          <EditableText value={txt('subheading')} onChange={v => set('subheading', v)}
            as="p" placeholder="Optional subheading…"
            className={`text-base font-light leading-relaxed ${dark ? 'text-white/60' : 'text-sacred-500'}`} />
        </div>
      )

    case 'text':
      return (
        <div className="max-w-3xl mx-auto px-8">
          <EditableText value={txt('body')} onChange={v => set('body', v)}
            as="p" placeholder="Your text content…"
            className={`text-base leading-relaxed font-light whitespace-pre-wrap ${dark ? 'text-white/70' : 'text-sacred-600'}`} />
        </div>
      )

    case 'image':
      return (
        <div className="max-w-5xl mx-auto px-8">
          <EditableImage src={txt('src')} alt={txt('alt')} caption={txt('caption')}
            onChange={(src, alt, cap) => onChange({ ...c, src, alt, caption: cap })} />
        </div>
      )

    case 'two-column':
      return (
        <div className="max-w-5xl mx-auto px-8 grid grid-cols-2 gap-12 items-start">
          <div>
            <EditableText value={txt('leftHeadline')} onChange={v => set('leftHeadline', v)}
              as="h3" placeholder="Column heading…"
              className={`font-heading text-xl mb-3 ${dark ? 'text-white' : 'text-sacred-900'}`} />
            <EditableText value={txt('leftBody')} onChange={v => set('leftBody', v)}
              as="p" placeholder="Left column text…"
              className={`text-sm leading-relaxed font-light whitespace-pre-wrap ${dark ? 'text-white/70' : 'text-sacred-600'}`} />
          </div>
          <div>
            <EditableText value={txt('rightHeadline')} onChange={v => set('rightHeadline', v)}
              as="h3" placeholder="Column heading…"
              className={`font-heading text-xl mb-3 ${dark ? 'text-white' : 'text-sacred-900'}`} />
            <EditableText value={txt('rightBody')} onChange={v => set('rightBody', v)}
              as="p" placeholder="Right column text…"
              className={`text-sm leading-relaxed font-light whitespace-pre-wrap ${dark ? 'text-white/70' : 'text-sacred-600'}`} />
          </div>
        </div>
      )

    case 'services':
      return (
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-12">
            <EditableText value={txt('eyebrow')} onChange={v => set('eyebrow', v)}
              as="p" placeholder="Eyebrow…" className="text-xs font-semibold uppercase tracking-[0.2em] text-yoga-600 mb-4" />
            <EditableText value={txt('headline')} onChange={v => set('headline', v)}
              as="h2" placeholder="Section title…" className="font-heading text-3xl text-sacred-900 mb-3" />
            <span className="block w-14 h-0.5 bg-yoga-400 mx-auto" />
            <EditableText value={txt('subheading')} onChange={v => set('subheading', v)}
              as="p" placeholder="Subheading…" className="text-sacred-500 mt-4 font-light" />
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-sacred-100">
                <div className="w-10 h-10 rounded-full bg-yoga-100 mb-4" />
                <div className="h-3 bg-sacred-200 rounded w-2/3 mb-2" />
                <div className="h-2 bg-sacred-100 rounded mb-1" />
                <div className="h-2 bg-sacred-100 rounded w-4/5" />
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-sacred-400 mt-4">Loaded from database · up to {txt('maxItems', '6')} services</p>
        </div>
      )

    case 'events':
      return (
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-12">
            <EditableText value={txt('eyebrow')} onChange={v => set('eyebrow', v)}
              as="p" placeholder="Eyebrow…" className="text-xs font-semibold uppercase tracking-[0.2em] text-yoga-600 mb-4" />
            <EditableText value={txt('headline')} onChange={v => set('headline', v)}
              as="h2" placeholder="Section title…" className="font-heading text-3xl text-sacred-900 mb-3" />
            <span className="block w-14 h-0.5 bg-yoga-400 mx-auto" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-6 p-6 bg-sacred-50 rounded-xl border border-sacred-100">
                <div className="w-16 h-16 bg-yoga-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-sacred-200 rounded w-1/2" />
                  <div className="h-2 bg-sacred-100 rounded w-3/4" />
                </div>
                <div className="w-24 h-8 bg-yoga-600 rounded self-center shrink-0" />
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-sacred-400 mt-4">Loaded from database · up to {txt('maxItems', '4')} events</p>
        </div>
      )

    case 'gallery':
      return (
        <div className="max-w-6xl mx-auto px-8">
          {txt('headline') && (
            <EditableText value={txt('headline')} onChange={v => set('headline', v)}
              as="h2" placeholder="Gallery title…"
              className="font-heading text-3xl text-sacred-900 text-center mb-10" />
          )}
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(Number(c.columns) || 3, 4)}, 1fr)` }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square bg-sacred-100 rounded-lg" />
            ))}
          </div>
          <p className="text-center text-xs text-sacred-400 mt-4">Loaded from gallery · up to {txt('maxItems', '12')} photos</p>
        </div>
      )

    case 'cta':
      return (
        <div className="max-w-3xl mx-auto px-8 text-center">
          <EditableText value={txt('eyebrow')} onChange={v => set('eyebrow', v)}
            as="p" placeholder="Eyebrow label…"
            className={`text-xs font-semibold uppercase tracking-[0.2em] mb-6 ${dark ? 'text-yoga-300' : 'text-yoga-600'}`} />
          <EditableText value={txt('headline')} onChange={v => set('headline', v)}
            as="h2" placeholder="CTA headline…"
            className={`font-heading text-3xl md:text-4xl leading-tight mb-4 ${dark ? 'text-white' : 'text-sacred-900'}`} />
          <span className="block w-16 h-0.5 bg-yoga-400 mx-auto mb-6" />
          <EditableText value={txt('subheading')} onChange={v => set('subheading', v)}
            as="p" placeholder="Supporting text…"
            className={`text-base font-light mb-10 ${dark ? 'text-white/70' : 'text-sacred-500'}`} />
          <EditableButton text={txt('ctaText')} link={txt('ctaLink')}
            onChange={(t, l) => onChange({ ...c, ctaText: t, ctaLink: l })} />
        </div>
      )

    case 'quote':
      return (
        <div className="max-w-3xl mx-auto px-8 text-center">
          <span className="block w-12 h-0.5 bg-yoga-400 mx-auto mb-8" />
          <EditableText value={txt('text')} onChange={v => set('text', v)}
            as="blockquote" placeholder="Your inspiring quote…"
            className={`font-heading text-2xl md:text-3xl leading-relaxed italic mb-6 ${dark ? 'text-white' : 'text-sacred-800'}`} />
          <p className={`text-sm uppercase tracking-widest ${dark ? 'text-white/50' : 'text-sacred-400'}`}>
            — <EditableText value={txt('author')} onChange={v => set('author', v)}
              as="span" placeholder="Author name"
              className="inline" />
            {txt('source') && (
              <> · <EditableText value={txt('source')} onChange={v => set('source', v)}
                as="span" placeholder="Source"
                className="inline" /></>
            )}
          </p>
          <span className="block w-12 h-0.5 bg-yoga-400 mx-auto mt-8" />
        </div>
      )

    case 'divider':
      return (
        <div className="max-w-6xl mx-auto px-8 flex items-center gap-6">
          <div className="flex-1 h-px bg-sacred-100" />
          <span className="w-1.5 h-1.5 rounded-full bg-yoga-400 shrink-0" />
          <div className="flex-1 h-px bg-sacred-100" />
        </div>
      )

    default:
      return null
  }
}

// ── Add section button ────────────────────────────────────────────────────────

function AddSectionButton({ onAdd }: { onAdd: (type: SectionType) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative h-8 flex items-center group/add">
      <div className="absolute inset-x-0 h-px bg-yoga-300/0 group-hover/add:bg-yoga-300/40 transition-colors" />
      <button onClick={() => setOpen(o => !o)}
        className="relative z-10 mx-auto w-7 h-7 rounded-full bg-white border-2 border-yoga-300 text-yoga-500 flex items-center justify-center opacity-0 group-hover/add:opacity-100 hover:border-yoga-500 hover:text-yoga-700 transition-all shadow-sm">
        <Plus size={13} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-40 bg-white border border-gray-200 rounded-2xl shadow-2xl p-3 w-64">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-2">Add section</p>
            <div className="grid grid-cols-2 gap-1">
              {SECTION_PALETTE.map(({ type, label, icon: Icon }) => (
                <button key={type} onClick={() => { onAdd(type); setOpen(false) }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-yoga-50 rounded-xl transition-colors">
                  <Icon size={14} className="text-yoga-600 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Section style panel ───────────────────────────────────────────────────────

function SectionStylePanel({ section, onChange, onClose }: {
  section: Section; onChange: (s: SectionStyle) => void; onClose: () => void
}) {
  const s = section.style
  return (
    <div className="fixed right-0 top-14 bottom-0 w-64 bg-white border-l border-gray-200 z-40 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Section Style</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-3">Background</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['white',  'White',     'bg-white border border-gray-200'],
              ['soft',   'Warm soft', 'bg-sacred-50'],
              ['dark',   'Dark',      'bg-sacred-900'],
              ['accent', 'Gold',      'bg-yoga-700'],
            ] as const).map(([val, label, preview]) => (
              <button key={val} onClick={() => onChange({ ...s, bg: val })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${s.bg === val ? 'border-yoga-500 bg-yoga-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <div className={`w-5 h-5 rounded-md ${preview} shrink-0`} />
                <span className="text-xs text-gray-700">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-3">Vertical Spacing</p>
          <div className="space-y-1.5">
            {([
              ['none', 'None'],
              ['sm',   'Small  (2rem)'],
              ['md',   'Medium (3rem)'],
              ['lg',   'Large  (4rem)'],
              ['xl',   'Extra large (6rem)'],
            ] as const).map(([val, label]) => (
              <button key={val} onClick={() => onChange({ ...s, paddingY: val })}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${s.paddingY === val ? 'bg-yoga-600 text-white' : 'text-gray-600 hover:bg-gray-50 border border-gray-100'}`}>
                <span>{label}</span>
                {s.paddingY === val && <span className="text-xs opacity-70">✓</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Draggable section block ───────────────────────────────────────────────────

function SectionBlock({
  section, isStylePanelOpen, onToggleStyle, onDelete, onChange, onStyleChange, onAddAfter,
}: {
  section: Section
  isStylePanelOpen: boolean
  onToggleStyle: () => void
  onDelete: () => void
  onChange: (c: Record<string, unknown>) => void
  onStyleChange: (s: SectionStyle) => void
  onAddAfter: (type: SectionType) => void
}) {
  const controls = useDragControls()
  const label = SECTION_PALETTE.find(p => p.type === section.type)?.label ?? section.type

  return (
    <Reorder.Item value={section} dragListener={false} dragControls={controls} layout>
      <div className={`group/section relative ${bgCls(section.style.bg)} ${pyCls(section.style.paddingY)}`}>

        {/* Section toolbar — visible on hover */}
        <div className="absolute top-2 right-3 z-20 flex items-center opacity-0 group-hover/section:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-0.5 bg-sacred-900/90 text-white rounded-lg px-1.5 py-1 shadow-lg">
            <button
              onPointerDown={e => { e.preventDefault(); controls.start(e) }}
              className="cursor-grab active:cursor-grabbing p-1 hover:text-yoga-300 touch-none"
              title="Drag to reorder">
              <GripVertical size={13} />
            </button>
            <span className="text-[10px] text-white/40 px-1.5 border-x border-white/10">{label}</span>
            <button onClick={onToggleStyle}
              className={`p-1 transition-colors ${isStylePanelOpen ? 'text-yoga-300' : 'hover:text-yoga-300'}`}
              title="Section style">
              <Settings2 size={13} />
            </button>
            <button onClick={onDelete} className="p-1 hover:text-red-400 transition-colors" title="Delete section">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Content */}
        <SectionContent section={section} onChange={onChange} />
      </div>

      {/* Add-section gap between sections */}
      <AddSectionButton onAdd={onAddAfter} />
    </Reorder.Item>
  )
}

// ── Main editor ───────────────────────────────────────────────────────────────

export default function PageEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()

  const [sections, setSections] = useState<Section[]>([])
  const [stylePanelId, setStylePanelId] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const { data: page, isLoading } = useQuery({
    queryKey: ['admin-page', id],
    queryFn: () => pagesApi.getPage(id).then(r => r.data.data!),
  })

  // Hydrate from saved contentJson, or initialize from template
  useEffect(() => {
    if (!page) return
    if (page.contentJson) {
      try {
        const parsed = JSON.parse(page.contentJson)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSections(parsed)
          return
        }
      } catch { /* fall through */ }
    }
    setSections(templateSections(page.template ?? 'default'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.id])

  const updateSection = useCallback((sid: string, content: Record<string, unknown>) => {
    setSections(prev => prev.map(s => s.id === sid ? { ...s, content } : s))
    setIsDirty(true)
  }, [])

  const updateStyle = useCallback((sid: string, style: SectionStyle) => {
    setSections(prev => prev.map(s => s.id === sid ? { ...s, style } : s))
    setIsDirty(true)
  }, [])

  const deleteSection = useCallback((sid: string) => {
    setSections(prev => prev.filter(s => s.id !== sid))
    setStylePanelId(p => p === sid ? null : p)
    setIsDirty(true)
  }, [])

  const addSectionAfter = useCallback((afterId: string | null, type: SectionType) => {
    const newSection = makeSection(type)
    setSections(prev => {
      if (!afterId) return [newSection, ...prev]
      const idx = prev.findIndex(s => s.id === afterId)
      const next = [...prev]
      next.splice(idx + 1, 0, newSection)
      return next
    })
    setIsDirty(true)
  }, [])

  const saveMutation = useMutation({
    mutationFn: (publish: boolean) =>
      pagesApi.updatePage(id, {
        ...(page as object),
        contentJson: JSON.stringify(sections),
        ...(publish ? { status: 'Published' } : {}),
      }),
    onSuccess: (_data, publish) => {
      qc.invalidateQueries({ queryKey: ['admin-page', id] })
      qc.invalidateQueries({ queryKey: ['admin-pages'] })
      toast.success(publish ? 'Page published' : 'Page saved')
      setIsDirty(false)
    },
    onError: () => toast.error('Failed to save'),
  })

  const stylePanelSection = sections.find(s => s.id === stylePanelId) ?? null

  if (isLoading || !page) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-sacred-900">
        <div className="w-8 h-8 border-2 border-yoga-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-gray-800">

      {/* ── Top bar ── */}
      <div className="bg-sacred-900 border-b border-sacred-800 h-14 flex items-center px-4 gap-3 shrink-0 z-30">
        <button onClick={() => router.push('/admin/pages')}
          className="flex items-center gap-1.5 text-sm text-sacred-300 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Pages</span>
        </button>
        <div className="w-px h-5 bg-sacred-700 mx-1 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-medium text-white text-sm">{page.title}</span>
          <span className="text-sacred-400 text-xs font-mono ml-2 hidden sm:inline">/{page.slug}</span>
        </div>
        {isDirty && (
          <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full hidden sm:inline-flex">
            Unsaved
          </span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium hidden sm:inline ${
          page.status === 'Published' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
        }`}>{page.status}</span>
        <button onClick={() => saveMutation.mutate(false)} disabled={saveMutation.isPending || !isDirty}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-sacred-600 text-sacred-200 rounded-lg hover:bg-sacred-800 disabled:opacity-40 transition-colors">
          <Save size={14} />
          Save
        </button>
        <button onClick={() => saveMutation.mutate(true)} disabled={saveMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-yoga-600 text-white text-sm rounded-lg hover:bg-yoga-700 disabled:opacity-50 transition-colors font-medium">
          <Globe size={14} />
          Save & Publish
        </button>
      </div>

      {/* ── Canvas ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Browser chrome bar */}
        <div className="sticky top-0 z-20 bg-gray-200 border-b border-gray-300 flex items-center gap-2 px-3 py-1.5">
          <div className="flex gap-1.5 shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-400/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
            <div className="w-3 h-3 rounded-full bg-green-400/70" />
          </div>
          <div className="flex-1 mx-2 bg-white rounded-full px-3 py-0.5 text-xs text-gray-500 font-mono truncate">
            sacredvibesyoga.com/{page.slug === 'home' ? '' : page.slug}
          </div>
          <span className="text-xs text-gray-500 hidden sm:block shrink-0">
            Click any text to edit · hover section for controls
          </span>
        </div>

        {/* Page surface */}
        <div className="bg-white min-h-screen max-w-[1200px] mx-auto shadow-2xl">

          {/* Add section at very top */}
          <AddSectionButton onAdd={type => addSectionAfter(null, type)} />

          <Reorder.Group axis="y" values={sections}
            onReorder={next => { setSections(next); setIsDirty(true) }}>
            {sections.map(section => (
              <SectionBlock
                key={section.id}
                section={section}
                isStylePanelOpen={stylePanelId === section.id}
                onToggleStyle={() => setStylePanelId(id => id === section.id ? null : section.id)}
                onDelete={() => deleteSection(section.id)}
                onChange={content => updateSection(section.id, content)}
                onStyleChange={style => updateStyle(section.id, style)}
                onAddAfter={type => addSectionAfter(section.id, type)}
              />
            ))}
          </Reorder.Group>

          {sections.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center px-8">
              <p className="text-sacred-400 text-sm">No sections yet — use the + button above to start building.</p>
            </div>
          )}
        </div>
      </div>

      {/* Section style panel (slides in from right) */}
      {stylePanelSection && (
        <SectionStylePanel
          section={stylePanelSection}
          onChange={style => updateStyle(stylePanelSection.id, style)}
          onClose={() => setStylePanelId(null)}
        />
      )}
    </div>
  )
}
