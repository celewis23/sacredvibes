'use client'

import AssetPicker from '@/components/admin/AssetPicker'
import type { NewsletterBannerFields } from '@/types'

const PRESET_COLORS = ['#5f5248', '#faf9f7', '#c9a96e', '#f3f0eb', '#1c1714', '#ffffff']

interface NewsletterBannerEditorProps {
  role: 'header' | 'footer'
  value: NewsletterBannerFields
  onChange: (value: NewsletterBannerFields) => void
}

export default function NewsletterBannerEditor({ role, value, onChange }: NewsletterBannerEditorProps) {
  const label = role === 'header' ? 'Header' : 'Footer'
  const textPlaceholder = role === 'header'
    ? 'A short title or welcome line shown at the top…'
    : 'A closing note, address, or contact info shown at the bottom…'

  const set = (patch: Partial<NewsletterBannerFields>) => onChange({ ...value, ...patch })

  return (
    <div className="space-y-4 bg-white border border-sacred-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-sacred-900">{label}</h3>

      <div>
        <label className="block text-xs font-medium text-sacred-700 mb-1.5">Background Color</label>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="color"
            value={value.backgroundColor || '#5f5248'}
            onChange={e => set({ backgroundColor: e.target.value })}
            className="w-10 h-10 rounded-lg border border-sacred-200 cursor-pointer"
          />
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              type="button"
              title={color}
              onClick={() => set({ backgroundColor: color })}
              className="w-7 h-7 rounded-full border border-sacred-200 shadow-sm"
              style={{ backgroundColor: color }}
            />
          ))}
          {value.backgroundColor && (
            <button
              type="button"
              onClick={() => set({ backgroundColor: undefined })}
              className="text-xs text-sacred-400 hover:text-sacred-700 underline"
            >
              Reset to default
            </button>
          )}
        </div>
      </div>

      <div>
        <AssetPicker
          label="Banner Image (optional)"
          accept="image"
          value={value.imageAssetId}
          onChange={id => set({ imageAssetId: id })}
        />
        <p className="text-xs text-sacred-400 mt-1">
          Shown full-width on top of the background color. Leave empty to use just the color.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
        <div>
          <label className="block text-xs font-medium text-sacred-700 mb-1.5">{label} Text</label>
          <textarea
            value={value.text || ''}
            onChange={e => set({ text: e.target.value })}
            placeholder={textPlaceholder}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-sacred-700 mb-1.5">Text Color</label>
          <input
            type="color"
            value={value.textColor || (role === 'header' ? '#f3f0eb' : '#a49280')}
            onChange={e => set({ textColor: e.target.value })}
            className="w-10 h-10 rounded-lg border border-sacred-200 cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}
