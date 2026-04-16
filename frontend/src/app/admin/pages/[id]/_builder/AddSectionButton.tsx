'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { SECTION_PALETTE } from './types'
import type { SectionType } from './types'

interface AddSectionButtonProps {
  onAdd: (type: SectionType) => void
  /** If true, renders as the very first section add button (top of empty canvas) */
  primary?: boolean
}

export default function AddSectionButton({ onAdd, primary = false }: AddSectionButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function pick(type: SectionType) {
    onAdd(type)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative group">
      {/* The thin divider line with centered button */}
      <div className={`flex items-center gap-2 ${primary ? 'py-6' : 'py-1'}`}>
        <div className={`flex-1 h-px transition-colors ${open ? 'bg-blue-400' : 'bg-transparent group-hover:bg-blue-200'}`} />
        <button
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all shadow-sm
            ${open
              ? 'bg-blue-600 text-white'
              : primary
                ? 'bg-yoga-700 text-white hover:bg-yoga-800'
                : 'bg-white text-gray-500 border border-gray-200 opacity-0 group-hover:opacity-100 hover:border-blue-300 hover:text-blue-600'
            }`}
        >
          <Plus size={12} />
          Add section
        </button>
        <div className={`flex-1 h-px transition-colors ${open ? 'bg-blue-400' : 'bg-transparent group-hover:bg-blue-200'}`} />
      </div>

      {/* Palette popover */}
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-[480px] mt-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Add a section</p>
          <div className="grid grid-cols-3 gap-2">
            {SECTION_PALETTE.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => pick(type)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-yoga-300 hover:bg-yoga-50 transition-all text-center group/item"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover/item:bg-yoga-100 flex items-center justify-center transition-colors">
                  <Icon size={16} className="text-gray-500 group-hover/item:text-yoga-700" />
                </div>
                <span className="text-xs text-gray-600 group-hover/item:text-yoga-700 font-medium leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
