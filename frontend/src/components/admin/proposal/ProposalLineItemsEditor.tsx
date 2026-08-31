'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { offeringsApi } from '@/lib/api'
import type { ProposalLineItem } from '@/types'

interface ProposalLineItemsEditorProps {
  value: ProposalLineItem[]
  onChange: (value: ProposalLineItem[]) => void
}

function formatCurrency(amount: number) {
  return amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

function reindex(items: ProposalLineItem[]): ProposalLineItem[] {
  return items.map((item, index) => ({ ...item, sortOrder: index }))
}

export default function ProposalLineItemsEditor({ value, onChange }: ProposalLineItemsEditorProps) {
  const [servicePickerOpen, setServicePickerOpen] = useState(false)

  const { data: services = [] } = useQuery({
    queryKey: ['services-for-proposal'],
    queryFn: () => offeringsApi.getServices({}).then(r => r.data.data ?? []),
    enabled: servicePickerOpen,
  })

  const update = (index: number, patch: Partial<ProposalLineItem>) => {
    const next = [...value]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  const addCustomLine = () => {
    onChange([...value, { id: `new-${Date.now()}`, description: '', price: 0, sortOrder: value.length }])
  }

  const addFromService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (!service) return
    onChange([...value, {
      id: `new-${Date.now()}`,
      description: service.name,
      price: service.price ?? 0,
      sortOrder: value.length,
      serviceOfferingId: service.id,
    }])
    setServicePickerOpen(false)
  }

  const remove = (index: number) => onChange(reindex(value.filter((_, i) => i !== index)))

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= value.length) return
    const next = [...value]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(reindex(next))
  }

  const total = value.reduce((sum, item) => sum + (Number.isFinite(item.price) ? item.price : 0), 0)

  return (
    <div className="space-y-4 bg-white border border-sacred-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-sacred-900">Pricing</h3>

      {value.length === 0 ? (
        <p className="text-sm text-sacred-400">No pricing lines yet — add one below, or skip this if the proposal doesn&apos;t need pricing.</p>
      ) : (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="flex flex-col">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="text-sacred-400 hover:text-sacred-700 disabled:opacity-30">
                  <ChevronUp size={14} />
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === value.length - 1} className="text-sacred-400 hover:text-sacred-700 disabled:opacity-30">
                  <ChevronDown size={14} />
                </button>
              </div>
              <input
                value={item.description}
                onChange={e => update(index, { description: e.target.value })}
                placeholder="Description"
                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={item.price}
                onChange={e => update(index, { price: parseFloat(e.target.value) || 0 })}
                className="w-28 px-3 py-2 rounded-lg border border-sacred-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-yoga-400"
              />
              <button type="button" onClick={() => remove(index)} className="text-sacred-400 hover:text-red-600 p-1 shrink-0" title="Remove">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-sacred-100">
        <span className="text-sm font-medium text-sacred-700">Total</span>
        <span className="text-base font-semibold text-sacred-900">{formatCurrency(total)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button
          type="button"
          onClick={addCustomLine}
          className="flex items-center gap-1.5 px-3 py-2 text-xs border border-sacred-200 text-sacred-700 rounded-lg hover:bg-sacred-50"
        >
          <Plus size={14} /> Add custom line
        </button>

        {!servicePickerOpen ? (
          <button
            type="button"
            onClick={() => setServicePickerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs border border-sacred-200 text-sacred-700 rounded-lg hover:bg-sacred-50"
          >
            <Plus size={14} /> Add from Services
          </button>
        ) : (
          <select
            defaultValue=""
            onChange={e => { if (e.target.value) addFromService(e.target.value) }}
            className="px-3 py-2 border border-sacred-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-yoga-400"
          >
            <option value="">Choose a service…</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.price != null ? ` — ${formatCurrency(s.price)}` : ''}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}
