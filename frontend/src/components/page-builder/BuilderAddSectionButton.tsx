'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { SECTION_PALETTE } from '@/lib/page-builder/types'
import type { SectionType } from '@/lib/page-builder/types'

export default function BuilderAddSectionButton({
  onAdd,
  primary = false,
}: {
  onAdd: (type: SectionType) => void
  primary?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handle(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div ref={ref} className="relative group/builder-add">
      <div className={`flex items-center gap-2 ${primary ? 'py-6' : 'py-1'}`}>
        <div className={`flex-1 h-px transition-colors ${open ? 'bg-yoga-400' : 'bg-transparent group-hover/builder-add:bg-yoga-200'}`} />
        <button
          type="button"
          onClick={() => setOpen(current => !current)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all shadow-sm ${
            open
              ? 'bg-yoga-700 text-white'
              : primary
                ? 'bg-yoga-700 text-white hover:bg-yoga-800'
                : 'bg-white/95 text-sacred-500 border border-sacred-200 opacity-0 group-hover/builder-add:opacity-100 hover:border-yoga-300 hover:text-yoga-700'
          }`}
        >
          <Plus size={12} />
          Add section
        </button>
        <div className={`flex-1 h-px transition-colors ${open ? 'bg-yoga-400' : 'bg-transparent group-hover/builder-add:bg-yoga-200'}`} />
      </div>

      {open && (
        <div className="absolute left-1/2 z-50 mt-1 w-[480px] -translate-x-1/2 rounded-2xl border border-sacred-200 bg-white p-4 shadow-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-sacred-400">Add a section</p>
          <div className="grid grid-cols-3 gap-2">
            {SECTION_PALETTE.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onAdd(type)
                  setOpen(false)
                }}
                className="group/item flex flex-col items-center gap-2 rounded-xl border border-sacred-100 p-3 text-center transition-all hover:border-yoga-300 hover:bg-yoga-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sacred-100 transition-colors group-hover/item:bg-yoga-100">
                  <Icon size={16} className="text-sacred-500 group-hover/item:text-yoga-700" />
                </div>
                <span className="text-xs font-medium leading-tight text-sacred-600 group-hover/item:text-yoga-700">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
