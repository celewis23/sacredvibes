'use client'

import type { Section } from './types'
import { str, num, bool, isDark } from './helpers'
import EditableText from './EditableText'

interface Props {
  section: Section
  selected: boolean
  onUpdate: (key: string, value: unknown) => void
  onSelect: () => void
}

export default function SectionContent({ section, selected, onUpdate, onSelect }: Props) {
  const { type, content, style } = section
  const dark = isDark(style.bg)

  const text = (k: string, opts?: {
    as?: string; className?: string; placeholder?: string; richText?: boolean; multiline?: boolean
  }) => (
    <EditableText
      value={str(content, k)}
      onChange={v => onUpdate(k, v)}
      onSelect={onSelect}
      as={opts?.as}
      className={opts?.className}
      placeholder={opts?.placeholder}
      richText={opts?.richText}
      multiline={opts?.multiline}
    />
  )

  const eyebrowCls = `text-xs font-semibold uppercase tracking-widest mb-3 ${dark ? 'text-yoga-400' : 'text-yoga-700'}`
  const headlineCls = `font-heading text-4xl md:text-5xl leading-tight mb-4 ${dark ? 'text-white' : 'text-sacred-900'}`
  const subCls = `text-lg leading-relaxed mb-6 ${dark ? 'text-sacred-300' : 'text-sacred-600'}`

  // ── HERO ──────────────────────────────────────────────────────────────────────
  if (type === 'hero') {
    return (
      <div
        className="relative min-h-[75vh] flex items-center overflow-hidden bg-sacred-900"
        onClick={onSelect}
      >
        {/* Exact gradient + orbs from public page */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #1c1714 0%, #2a1e18 35%, #1f1a16 65%, #161210 100%)' }}
          />
          <div className="orb w-[700px] h-[700px] bg-yoga-700" style={{ top: '-150px', right: '-180px', opacity: 0.12 }} />
          <div className="orb w-[500px] h-[500px] bg-yoga-600" style={{ bottom: '-100px', left: '-120px', opacity: 0.09 }} />
        </div>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.4) 100%)' }}
        />
        <div className="relative z-10 container-sacred w-full pt-32 pb-20">
          <div className="max-w-3xl mx-auto text-center">
            {str(content, 'eyebrow') && (
              <div className="inline-flex items-center gap-3 mb-8 pointer-events-none">
                <span className="w-8 h-px bg-yoga-400/70" />
                {text('eyebrow', { as: 'span', className: 'eyebrow text-yoga-300', placeholder: 'Eyebrow', multiline: false })}
                <span className="w-8 h-px bg-yoga-400/70" />
              </div>
            )}
            {text('headline', {
              as: 'h1',
              className: 'font-heading text-display-xl md:text-display-2xl text-white leading-tight mb-6 text-balance',
              placeholder: 'Hero headline',
              multiline: false,
            })}
            <span className="gold-line w-20 block mx-auto mb-8 pointer-events-none" />
            {text('subheading', {
              as: 'p',
              className: 'text-lg text-white/70 leading-relaxed mb-12 font-body font-light tracking-wide max-w-2xl mx-auto',
              placeholder: 'Hero subheading…',
              richText: true,
            })}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {str(content, 'ctaText') && (
                <span className="btn-gold">
                  {text('ctaText', { as: 'span', placeholder: 'Button text', multiline: false })}
                </span>
              )}
              {str(content, 'ctaSecondaryText') && (
                <span className="btn-ghost-light">
                  {text('ctaSecondaryText', { as: 'span', placeholder: 'Secondary button', multiline: false })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── HEADING ───────────────────────────────────────────────────────────────────
  if (type === 'heading') {
    const align = str(content, 'align') || 'center'
    const alignCls = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'
    return (
      <div className={`container-sacred ${alignCls}`} onClick={onSelect}>
        {text('eyebrow', { as: 'p', className: eyebrowCls, placeholder: 'Section label', multiline: false })}
        {text('headline', { as: 'h2', className: headlineCls, placeholder: 'Section title', multiline: false })}
        {text('subheading', { as: 'p', className: `${subCls} max-w-2xl ${align === 'center' ? 'mx-auto' : ''}`, placeholder: 'Subheading (optional)', richText: true })}
      </div>
    )
  }

  // ── TEXT ──────────────────────────────────────────────────────────────────────
  if (type === 'text') {
    return (
      <div className="container-sacred max-w-3xl mx-auto" onClick={onSelect}>
        {text('body', {
          as: 'div',
          className: `text-base leading-relaxed whitespace-pre-wrap ${dark ? 'text-sacred-200' : 'text-sacred-700'}`,
          placeholder: 'Enter your text…',
          richText: true,
        })}
      </div>
    )
  }

  // ── IMAGE ─────────────────────────────────────────────────────────────────────
  if (type === 'image') {
    const src = str(content, 'src')
    return (
      <div className="container-sacred" onClick={onSelect}>
        <div className="relative rounded-2xl overflow-hidden bg-sacred-100 border border-sacred-200 min-h-[200px] flex items-center justify-center">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={str(content, 'alt')} className="w-full h-auto object-cover" />
          ) : (
            <div className="text-sacred-400 text-sm py-12 px-6 text-center">
              <p className="font-medium mb-1">Image placeholder</p>
              <p className="text-xs opacity-60">Set the image URL in the inspector panel</p>
            </div>
          )}
        </div>
        {text('caption', { as: 'p', className: 'text-xs text-sacred-400 mt-2 text-center', placeholder: 'Caption (optional)', multiline: false })}
      </div>
    )
  }

  // ── TWO-COLUMN ────────────────────────────────────────────────────────────────
  if (type === 'two-column') {
    return (
      <div className="container-sacred" onClick={onSelect}>
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div>
            {text('leftHeadline', { as: 'h3', className: `font-heading text-2xl md:text-3xl mb-4 ${dark ? 'text-white' : 'text-sacred-900'}`, placeholder: 'Left heading', multiline: false })}
            {text('leftBody', { as: 'div', className: `leading-relaxed whitespace-pre-wrap ${dark ? 'text-sacred-300' : 'text-sacred-600'}`, placeholder: 'Left column content…', richText: true })}
          </div>
          <div>
            {text('rightHeadline', { as: 'h3', className: `font-heading text-2xl md:text-3xl mb-4 ${dark ? 'text-white' : 'text-sacred-900'}`, placeholder: 'Right heading', multiline: false })}
            {text('rightBody', { as: 'div', className: `leading-relaxed whitespace-pre-wrap ${dark ? 'text-sacred-300' : 'text-sacred-600'}`, placeholder: 'Right column content…', richText: true })}
          </div>
        </div>
      </div>
    )
  }

  // ── SERVICES (read-only placeholder) ─────────────────────────────────────────
  if (type === 'services') {
    return (
      <div className="container-sacred" onClick={onSelect}>
        <div className="text-center mb-10">
          {text('eyebrow', { as: 'p', className: eyebrowCls, placeholder: 'Eyebrow label', multiline: false })}
          {text('headline', { as: 'h2', className: headlineCls, placeholder: 'Section title', multiline: false })}
          {text('subheading', { as: 'p', className: `${subCls} max-w-2xl mx-auto`, placeholder: 'Subheading', richText: true })}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className={`rounded-xl p-5 border ${dark ? 'bg-white/5 border-white/10' : 'bg-white border-sacred-100'}`}>
              <div className={`w-8 h-8 rounded-lg mb-3 ${dark ? 'bg-yoga-500/30' : 'bg-yoga-100'}`} />
              <div className={`h-3 rounded ${dark ? 'bg-white/20' : 'bg-sacred-200'} mb-2 w-3/4`} />
              <div className={`h-2 rounded ${dark ? 'bg-white/10' : 'bg-sacred-100'} w-full`} />
            </div>
          ))}
        </div>
        <p className={`text-xs mt-4 text-center opacity-50 ${dark ? 'text-white' : 'text-sacred-500'}`}>
          Live services will appear here — showing up to {num(content, 'maxItems', 6)} items
        </p>
      </div>
    )
  }

  // ── EVENTS (read-only placeholder) ───────────────────────────────────────────
  if (type === 'events') {
    return (
      <div className="container-sacred" onClick={onSelect}>
        <div className="text-center mb-10">
          {text('eyebrow', { as: 'p', className: eyebrowCls, placeholder: 'Eyebrow label', multiline: false })}
          {text('headline', { as: 'h2', className: headlineCls, placeholder: 'Section title', multiline: false })}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className={`rounded-xl p-4 border flex gap-4 items-center ${dark ? 'bg-white/5 border-white/10' : 'bg-white border-sacred-100'}`}>
              <div className={`w-12 h-12 rounded-lg shrink-0 ${dark ? 'bg-white/20' : 'bg-sacred-200'}`} />
              <div className="flex-1 min-w-0">
                <div className={`h-3 rounded ${dark ? 'bg-white/20' : 'bg-sacred-200'} mb-2 w-1/2`} />
                <div className={`h-2 rounded ${dark ? 'bg-white/10' : 'bg-sacred-100'} w-3/4`} />
              </div>
            </div>
          ))}
        </div>
        <p className={`text-xs mt-4 text-center opacity-50 ${dark ? 'text-white' : 'text-sacred-500'}`}>
          Live events will appear here — showing up to {num(content, 'maxItems', 4)} upcoming events
        </p>
      </div>
    )
  }

  // ── GALLERY (read-only placeholder) ──────────────────────────────────────────
  if (type === 'gallery') {
    const cols = num(content, 'columns', 3)
    return (
      <div className="container-sacred" onClick={onSelect}>
        {str(content, 'headline') !== '' && text('headline', { as: 'h2', className: `${headlineCls} text-center mb-8`, placeholder: 'Gallery title', multiline: false })}
        <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: Math.min(cols * 2, 6) }).map((_, i) => (
            <div key={i} className={`aspect-square rounded-xl ${dark ? 'bg-white/10' : 'bg-sacred-100'}`} />
          ))}
        </div>
        <p className={`text-xs mt-4 text-center opacity-50 ${dark ? 'text-white' : 'text-sacred-500'}`}>
          Live gallery photos will appear here
        </p>
      </div>
    )
  }

  // ── CTA ───────────────────────────────────────────────────────────────────────
  if (type === 'cta') {
    return (
      <div className="container-sacred text-center" onClick={onSelect}>
        <div className="gold-line mx-auto mb-6" />
        {text('eyebrow', { as: 'p', className: eyebrowCls, placeholder: 'Eyebrow (optional)', multiline: false })}
        {text('headline', { as: 'h2', className: `font-heading text-4xl md:text-5xl font-bold mb-4 ${dark ? 'text-white' : 'text-sacred-900'}`, placeholder: 'CTA headline', multiline: false })}
        {text('subheading', { as: 'p', className: `text-lg mb-8 max-w-xl mx-auto ${dark ? 'text-sacred-300' : 'text-sacred-600'}`, placeholder: 'Subheading', richText: true })}
        <div className="flex flex-wrap gap-4 justify-center">
          <span className="btn-gold text-sm px-6 py-2.5 rounded-full inline-block">
            {text('ctaText', { as: 'span', placeholder: 'Button text', multiline: false })}
          </span>
          {str(content, 'ctaSecondaryText') !== '' && (
            <span className="btn-ghost-light text-sm px-6 py-2.5 rounded-full inline-block">
              {text('ctaSecondaryText', { as: 'span', placeholder: 'Secondary button', multiline: false })}
            </span>
          )}
        </div>
      </div>
    )
  }

  // ── QUOTE ─────────────────────────────────────────────────────────────────────
  if (type === 'quote') {
    return (
      <div className="container-sacred max-w-3xl mx-auto text-center" onClick={onSelect}>
        <div className={`text-5xl mb-4 leading-none ${dark ? 'text-yoga-400' : 'text-yoga-300'}`}>&ldquo;</div>
        {text('text', {
          as: 'blockquote',
          className: `font-heading text-2xl md:text-3xl leading-relaxed italic mb-6 ${dark ? 'text-white' : 'text-sacred-900'}`,
          placeholder: 'Quote text…',
          richText: true,
        })}
        <div className="flex items-center justify-center gap-3">
          <div className={`h-px w-8 ${dark ? 'bg-yoga-400' : 'bg-yoga-300'}`} />
          <div>
            {text('author', { as: 'span', className: `block font-medium text-sm ${dark ? 'text-white' : 'text-sacred-900'}`, placeholder: 'Author name', multiline: false })}
            {text('source', { as: 'span', className: `block text-xs mt-0.5 ${dark ? 'text-sacred-400' : 'text-sacred-500'}`, placeholder: 'Source (optional)', multiline: false })}
          </div>
          <div className={`h-px w-8 ${dark ? 'bg-yoga-400' : 'bg-yoga-300'}`} />
        </div>
      </div>
    )
  }

  // ── DIVIDER ───────────────────────────────────────────────────────────────────
  if (type === 'divider') {
    return (
      <div className="container-sacred flex items-center gap-4" onClick={onSelect}>
        <div className={`flex-1 h-px ${dark ? 'bg-white/10' : 'bg-sacred-200'}`} />
        <div className={`w-1.5 h-1.5 rounded-full ${dark ? 'bg-yoga-400' : 'bg-yoga-300'}`} />
        <div className={`flex-1 h-px ${dark ? 'bg-white/10' : 'bg-sacred-200'}`} />
      </div>
    )
  }

  return null
}
