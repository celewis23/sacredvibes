'use client'

import type { Section, SectionStyle } from './types'
import { str, num, bool } from './helpers'
import { Copy, Trash2, EyeOff, Eye } from 'lucide-react'

interface InspectorPanelProps {
  section: Section | null
  onUpdate: (key: string, value: unknown) => void
  onUpdateStyle: (patch: Partial<SectionStyle>) => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleHidden: () => void
}

const BG_OPTIONS: { label: string; value: SectionStyle['bg']; preview: string }[] = [
  { label: 'White', value: 'white', preview: 'bg-white border border-gray-300' },
  { label: 'Soft', value: 'soft', preview: 'bg-sacred-50 border border-sacred-200' },
  { label: 'Dark', value: 'dark', preview: 'bg-sacred-900' },
  { label: 'Accent', value: 'accent', preview: 'bg-yoga-700' },
]

const PADDING_OPTIONS: { label: string; value: SectionStyle['paddingY'] }[] = [
  { label: 'None', value: 'none' },
  { label: 'S', value: 'sm' },
  { label: 'M', value: 'md' },
  { label: 'L', value: 'lg' },
  { label: 'XL', value: 'xl' },
]

export default function InspectorPanel({
  section,
  onUpdate,
  onUpdateStyle,
  onDuplicate,
  onDelete,
  onToggleHidden,
}: InspectorPanelProps) {
  if (!section) {
    return (
      <aside className="w-72 shrink-0 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Inspector</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-center px-6">
          <p className="text-xs text-gray-400">Click a section on the canvas to inspect and edit it.</p>
        </div>
      </aside>
    )
  }

  const { type, content, style } = section

  return (
    <aside className="w-72 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Section</h3>
          <p className="text-sm font-medium text-gray-800 capitalize mt-0.5">{type.replace('-', ' ')}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onToggleHidden} title={section.hidden ? 'Show section' : 'Hide section'}
            className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            {section.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button onClick={onDuplicate} title="Duplicate section"
            className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <Copy size={14} />
          </button>
          <button onClick={onDelete} title="Delete section"
            className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Style Controls */}
      <div className="p-4 border-b border-gray-100 space-y-4 shrink-0">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">Background</label>
          <div className="flex gap-2">
            {BG_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onUpdateStyle({ bg: opt.value })}
                title={opt.label}
                className={`w-8 h-8 rounded-lg transition-all ${opt.preview} ${style.bg === opt.value ? 'ring-2 ring-yoga-600 ring-offset-1' : 'hover:scale-110'}`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">Padding</label>
          <div className="flex gap-1">
            {PADDING_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onUpdateStyle({ paddingY: opt.value })}
                className={`flex-1 py-1 text-xs rounded transition-colors ${
                  style.paddingY === opt.value
                    ? 'bg-yoga-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section-specific content fields */}
      <div className="p-4 space-y-3 flex-1">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Content</label>
        <ContentFields type={type} content={content} onUpdate={onUpdate} />
      </div>
    </aside>
  )
}

// ── Per-type content fields ───────────────────────────────────────────────────

function ContentFields({
  type, content, onUpdate,
}: {
  type: Section['type']
  content: Record<string, unknown>
  onUpdate: (key: string, value: unknown) => void
}) {
  const field = (key: string, label: string, opts?: { type?: string; placeholder?: string; rows?: number }) => (
    <div key={key}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {opts?.rows ? (
        <textarea
          value={str(content, key)}
          onChange={e => onUpdate(key, e.target.value)}
          rows={opts.rows}
          placeholder={opts?.placeholder}
          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yoga-400 resize-none"
        />
      ) : (
        <input
          type={opts?.type ?? 'text'}
          value={opts?.type === 'number' ? num(content, key) : str(content, key)}
          onChange={e => onUpdate(key, opts?.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
          placeholder={opts?.placeholder}
          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yoga-400"
        />
      )}
    </div>
  )

  const checkField = (key: string, label: string) => (
    <label key={key} className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={bool(content, key)}
        onChange={e => onUpdate(key, e.target.checked)}
        className="rounded border-gray-300 text-yoga-600 focus:ring-yoga-400"
      />
      <span className="text-xs text-gray-700">{label}</span>
    </label>
  )

  switch (type) {
    case 'hero':
    case 'cta':
      return (
        <>
          {field('eyebrow', 'Eyebrow', { placeholder: 'Short label above headline' })}
          {field('headline', 'Headline')}
          {field('subheading', 'Subheading', { rows: 3 })}
          {field('ctaText', 'Primary button text')}
          {field('ctaLink', 'Primary button link', { placeholder: '/booking' })}
          {field('ctaSecondaryText', 'Secondary button text')}
          {field('ctaSecondaryLink', 'Secondary button link')}
        </>
      )

    case 'heading':
      return (
        <>
          {field('eyebrow', 'Eyebrow')}
          {field('headline', 'Headline')}
          {field('subheading', 'Subheading', { rows: 2 })}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Alignment</label>
            <select
              value={str(content, 'align') || 'center'}
              onChange={e => onUpdate('align', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yoga-400"
            >
              {['left', 'center', 'right'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </>
      )

    case 'text':
      return field('body', 'Body text', { rows: 6 })

    case 'image':
      return (
        <>
          {field('src', 'Image URL', { placeholder: 'https://…' })}
          {field('alt', 'Alt text')}
          {field('caption', 'Caption')}
        </>
      )

    case 'two-column':
      return (
        <>
          {field('leftHeadline', 'Left heading')}
          {field('leftBody', 'Left body', { rows: 4 })}
          {field('rightHeadline', 'Right heading')}
          {field('rightBody', 'Right body', { rows: 4 })}
        </>
      )

    case 'services':
    case 'events':
      return (
        <>
          {field('eyebrow', 'Eyebrow')}
          {field('headline', 'Headline')}
          {field('subheading', 'Subheading')}
          {field('maxItems', 'Max items', { type: 'number' })}
          {type === 'events' && checkField('upcomingOnly', 'Show upcoming events only')}
        </>
      )

    case 'gallery':
      return (
        <>
          {field('headline', 'Headline')}
          {field('columns', 'Columns', { type: 'number' })}
          {field('maxItems', 'Max items', { type: 'number' })}
        </>
      )

    case 'quote':
      return (
        <>
          {field('text', 'Quote text', { rows: 3 })}
          {field('author', 'Author name')}
          {field('source', 'Source / attribution')}
        </>
      )

    case 'divider':
      return <p className="text-xs text-gray-400">No content to configure.</p>

    default:
      return null
  }
}
