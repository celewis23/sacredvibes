'use client'

import { useRef } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import {
  GripVertical, Copy, Trash2, EyeOff, Eye, ChevronUp, ChevronDown,
} from 'lucide-react'
import type { Section } from './types'
import { SECTION_TYPES } from './types'
import { bgCls, pyCls } from './helpers'
import SectionContent from './SectionContent'
import AddSectionButton from './AddSectionButton'
import type { SectionType } from './types'

interface SectionBlockProps {
  section: Section
  selected: boolean
  onSelect: () => void
  onUpdate: (key: string, value: unknown) => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleHidden: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onAddAfter: (type: SectionType) => void
  isFirst: boolean
  isLast: boolean
}

export default function SectionBlock({
  section,
  selected,
  onSelect,
  onUpdate,
  onDuplicate,
  onDelete,
  onToggleHidden,
  onMoveUp,
  onMoveDown,
  onAddAfter,
  isFirst,
  isLast,
}: SectionBlockProps) {
  const controls = useDragControls()
  const { type, style, hidden } = section
  const meta = SECTION_TYPES[type]

  return (
    <Reorder.Item value={section} dragListener={false} dragControls={controls} className="relative group/block">
      {/* Selection / hover ring */}
      <div
        onClick={onSelect}
        className={`relative transition-all duration-150
          ${selected
            ? 'outline outline-2 outline-blue-500 outline-offset-[-2px]'
            : 'outline outline-1 outline-transparent group-hover/block:outline-blue-200 outline-offset-[-1px]'
          }
          ${hidden ? 'opacity-40' : ''}
        `}
      >
        {/* Section top toolbar (visible on hover/select) */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full z-30 flex items-center gap-0.5 bg-gray-900 text-white rounded-t-lg px-2 py-1 transition-opacity pointer-events-none
            ${selected ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover/block:opacity-100 group-hover/block:pointer-events-auto'}`}
        >
          {/* Drag handle */}
          <button
            onPointerDown={e => controls.start(e)}
            className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-white transition-colors touch-none"
            title="Drag to reorder"
          >
            <GripVertical size={13} />
          </button>

          {/* Type label */}
          <span className="text-xs text-gray-400 px-1 select-none">{meta.label}</span>

          <div className="w-px h-4 bg-white/20 mx-0.5" />

          <button onClick={e => { e.stopPropagation(); onMoveUp() }} disabled={isFirst}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 transition-colors" title="Move up">
            <ChevronUp size={13} />
          </button>
          <button onClick={e => { e.stopPropagation(); onMoveDown() }} disabled={isLast}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 transition-colors" title="Move down">
            <ChevronDown size={13} />
          </button>

          <div className="w-px h-4 bg-white/20 mx-0.5" />

          <button onClick={e => { e.stopPropagation(); onToggleHidden() }}
            className="p-1 text-gray-400 hover:text-white transition-colors" title={hidden ? 'Show' : 'Hide'}>
            {hidden ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
          <button onClick={e => { e.stopPropagation(); onDuplicate() }}
            className="p-1 text-gray-400 hover:text-white transition-colors" title="Duplicate">
            <Copy size={13} />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete() }}
            className="p-1 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
            <Trash2 size={13} />
          </button>
        </div>

        {/* Section background + padding */}
        <div className={`${bgCls(style.bg)} ${pyCls(style.paddingY)}`}>
          <SectionContent
            section={section}
            selected={selected}
            onUpdate={onUpdate}
            onSelect={onSelect}
          />
        </div>
      </div>

      {/* Add-section button between sections */}
      <AddSectionButton onAdd={onAddAfter} />
    </Reorder.Item>
  )
}
