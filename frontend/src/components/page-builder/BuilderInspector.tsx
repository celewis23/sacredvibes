'use client'

import { Copy, Eye, EyeOff, Trash2 } from 'lucide-react'
import { usePageBuilder } from '@/components/page-builder/PageBuilderProvider'
import { bool, num, str } from '@/lib/page-builder/helpers'
import type { SectionStyle, SpaceScale } from '@/lib/page-builder/types'

const BG_OPTIONS: { label: string; value: SectionStyle['bg']; preview: string }[] = [
  { label: 'White', value: 'white', preview: 'bg-white border border-sacred-300' },
  { label: 'Soft', value: 'soft', preview: 'bg-sacred-50 border border-sacred-200' },
  { label: 'Dark', value: 'dark', preview: 'bg-sacred-900' },
  { label: 'Accent', value: 'accent', preview: 'bg-yoga-700' },
]

const SPACE_OPTIONS: { label: string; value: SpaceScale }[] = [
  { label: 'None', value: 'none' },
  { label: 'S', value: 'sm' },
  { label: 'M', value: 'md' },
  { label: 'L', value: 'lg' },
  { label: 'XL', value: 'xl' },
]

const RADIUS_OPTIONS: NonNullable<SectionStyle['radius']>[] = ['none', 'lg', 'xl', '2xl']

export default function BuilderInspector() {
  const {
    sections,
    selectedSectionId,
    selectedField,
    updateField,
    updateStyle,
    duplicateSection,
    deleteSection,
    toggleHidden,
  } = usePageBuilder()

  const section = sections.find((item) => item.id === selectedSectionId) ?? null

  if (!section) {
    return (
      <aside className="w-80 shrink-0 border-l border-sacred-200 bg-white">
        <div className="border-b border-sacred-100 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sacred-400">Inspector</p>
        </div>
        <div className="flex h-full items-center justify-center px-8 text-center">
          <p className="text-sm text-sacred-400">Select a section on the canvas to edit its layout, media, and content bindings.</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-l border-sacred-200 bg-white">
      <div className="sticky top-0 z-20 border-b border-sacred-100 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sacred-400">Inspector</p>
            <h2 className="mt-1 text-sm font-semibold text-sacred-900 capitalize">{section.type.replace('-', ' ')}</h2>
            {selectedField && (
              <p className="mt-1 text-xs text-sacred-500">Selected field: {selectedField.label ?? selectedField.field}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <IconButton title={section.hidden ? 'Show section' : 'Hide section'} onClick={() => toggleHidden(section.id)}>
              {section.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
            </IconButton>
            <IconButton title="Duplicate section" onClick={() => duplicateSection(section.id)}>
              <Copy size={14} />
            </IconButton>
            <IconButton title="Delete section" danger onClick={() => deleteSection(section.id)}>
              <Trash2 size={14} />
            </IconButton>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-5 py-5">
        <Panel title="Layout">
          <FieldLabel>Background</FieldLabel>
          <div className="flex gap-2">
            {BG_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                title={option.label}
                onClick={() => updateStyle(section.id, { bg: option.value })}
                className={`h-9 w-9 rounded-xl transition-all ${option.preview} ${
                  section.style.bg === option.value ? 'ring-2 ring-yoga-600 ring-offset-2' : 'hover:scale-105'
                }`}
              />
            ))}
          </div>

          <SegmentedField
            label="Padding"
            value={section.style.paddingY}
            options={SPACE_OPTIONS}
            onChange={(value) => updateStyle(section.id, { paddingY: value })}
          />
          <SegmentedField
            label="Top Margin"
            value={section.style.marginTop ?? 'none'}
            options={SPACE_OPTIONS}
            onChange={(value) => updateStyle(section.id, { marginTop: value })}
          />
          <SegmentedField
            label="Bottom Margin"
            value={section.style.marginBottom ?? 'none'}
            options={SPACE_OPTIONS}
            onChange={(value) => updateStyle(section.id, { marginBottom: value })}
          />

          <FieldLabel>Section Radius</FieldLabel>
          <div className="grid grid-cols-4 gap-2">
            {RADIUS_OPTIONS.map((radius) => (
              <button
                key={radius}
                type="button"
                onClick={() => updateStyle(section.id, { radius })}
                className={`rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${
                  (section.style.radius ?? 'none') === radius
                    ? 'border-yoga-300 bg-yoga-50 text-yoga-700'
                    : 'border-sacred-200 text-sacred-500 hover:border-sacred-300'
                }`}
              >
                {radius}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Content">
          <ContentFields
            sectionId={section.id}
            type={section.type}
            content={section.content}
            onUpdate={(field, value) => updateField(section.id, field, value)}
          />
        </Panel>
      </div>
    </aside>
  )
}

function Panel({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-sacred-100 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-sacred-400">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-sacred-600">{children}</label>
}

function IconButton({
  title,
  danger = false,
  onClick,
  children,
}: {
  title: string
  danger?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg p-1.5 transition-colors ${
        danger ? 'text-sacred-400 hover:bg-red-50 hover:text-red-600' : 'text-sacred-400 hover:bg-sacred-100 hover:text-sacred-700'
      }`}
    >
      {children}
    </button>
  )
}

function SegmentedField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { label: string; value: SpaceScale }[]
  onChange: (value: SpaceScale) => void
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="grid grid-cols-5 gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              value === option.value
                ? 'bg-yoga-700 text-white'
                : 'bg-sacred-100 text-sacred-500 hover:bg-sacred-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ContentFields({
  sectionId,
  type,
  content,
  onUpdate,
}: {
  sectionId: string
  type: string
  content: Record<string, unknown>
  onUpdate: (field: string, value: unknown) => void
}) {
  const field = (
    key: string,
    label: string,
    opts?: { type?: 'text' | 'number'; rows?: number; placeholder?: string },
  ) => (
    <div key={`${sectionId}:${key}`}>
      <FieldLabel>{label}</FieldLabel>
      {opts?.rows ? (
        <textarea
          value={str(content, key)}
          rows={opts.rows}
          placeholder={opts.placeholder}
          onChange={(event) => onUpdate(key, event.target.value)}
          className="mt-1 w-full rounded-xl border border-sacred-200 px-3 py-2 text-sm text-sacred-900 outline-none transition focus:border-yoga-300 focus:ring-2 focus:ring-yoga-200"
        />
      ) : (
        <input
          type={opts?.type ?? 'text'}
          value={opts?.type === 'number' ? num(content, key) : str(content, key)}
          placeholder={opts?.placeholder}
          onChange={(event) => onUpdate(key, opts?.type === 'number' ? Number(event.target.value) : event.target.value)}
          className="mt-1 w-full rounded-xl border border-sacred-200 px-3 py-2 text-sm text-sacred-900 outline-none transition focus:border-yoga-300 focus:ring-2 focus:ring-yoga-200"
        />
      )}
    </div>
  )

  const checkbox = (key: string, label: string) => (
    <label key={`${sectionId}:${key}`} className="flex items-center gap-3 rounded-xl border border-sacred-100 px-3 py-2">
      <input
        type="checkbox"
        checked={bool(content, key)}
        onChange={(event) => onUpdate(key, event.target.checked)}
        className="rounded border-sacred-300 text-yoga-600 focus:ring-yoga-400"
      />
      <span className="text-sm text-sacred-700">{label}</span>
    </label>
  )

  switch (type) {
    case 'hero':
      return (
        <>
          <p className="text-xs text-sacred-400">Double-click the headline, eyebrow, or supporting text on the canvas to edit inline.</p>
          {field('backgroundImage', 'Background image URL', { placeholder: '/images/about.jpg or https://...' })}
          {field('overlayOpacity', 'Overlay opacity', { type: 'number' })}
          {field('ctaLink', 'Primary button link', { placeholder: '/booking' })}
          {field('ctaSecondaryLink', 'Secondary button link', { placeholder: '/contact' })}
        </>
      )

    case 'heading':
      return (
        <>
          <p className="text-xs text-sacred-400">Edit heading text inline on the canvas. Use alignment here when needed.</p>
          <div>
            <FieldLabel>Alignment</FieldLabel>
            <select
              value={str(content, 'align') || 'center'}
              onChange={(event) => onUpdate('align', event.target.value)}
              className="mt-1 w-full rounded-xl border border-sacred-200 px-3 py-2 text-sm text-sacred-900 outline-none transition focus:border-yoga-300 focus:ring-2 focus:ring-yoga-200"
            >
              {['left', 'center', 'right'].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
        </>
      )

    case 'text':
      return <p className="text-xs text-sacred-400">Rich text edits happen inline on the canvas with the floating formatting toolbar.</p>

    case 'image':
      return (
        <>
          {field('src', 'Image URL', { placeholder: 'https://…' })}
          {field('alt', 'Alt text')}
          {field('caption', 'Caption')}
          <div>
            <FieldLabel>Object fit</FieldLabel>
            <select
              value={str(content, 'fit') || 'cover'}
              onChange={(event) => onUpdate('fit', event.target.value)}
              className="mt-1 w-full rounded-xl border border-sacred-200 px-3 py-2 text-sm text-sacred-900 outline-none transition focus:border-yoga-300 focus:ring-2 focus:ring-yoga-200"
            >
              {['cover', 'contain', 'fill'].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          {field('focalX', 'Focal point X (%)', { type: 'number' })}
          {field('focalY', 'Focal point Y (%)', { type: 'number' })}
          {field('widthPercent', 'Width (%)', { type: 'number' })}
          {field('heightPx', 'Height (px)', { type: 'number' })}
        </>
      )

    case 'two-column':
      return <p className="text-xs text-sacred-400">Column headlines and body copy can be edited inline. This panel keeps layout-level controls only.</p>

    case 'services':
      return (
        <>
          <p className="text-xs text-sacred-400">Section headings are editable inline. Configure data display here.</p>
          {field('maxItems', 'Max items', { type: 'number' })}
        </>
      )

    case 'events':
      return (
        <>
          <p className="text-xs text-sacred-400">Section headings are editable inline. Configure event display here.</p>
          {field('maxItems', 'Max items', { type: 'number' })}
          {checkbox('upcomingOnly', 'Only show upcoming events')}
        </>
      )

    case 'gallery':
      return (
        <>
          <p className="text-xs text-sacred-400">Edit the headline inline and control gallery density here.</p>
          {field('columns', 'Columns', { type: 'number' })}
          {field('maxItems', 'Max items', { type: 'number' })}
        </>
      )

    case 'cta':
      return (
        <>
          <p className="text-xs text-sacred-400">Edit CTA copy inline. Use these controls for the button destinations.</p>
          {field('ctaLink', 'Primary button link', { placeholder: '/booking' })}
          {field('ctaSecondaryLink', 'Secondary button link', { placeholder: '/contact' })}
        </>
      )

    case 'quote':
      return <p className="text-xs text-sacred-400">Quote text and attribution are editable directly on the page.</p>

    case 'divider':
      return <p className="text-xs text-sacred-400">Divider sections do not have additional content controls.</p>

    default:
      return null
  }
}
