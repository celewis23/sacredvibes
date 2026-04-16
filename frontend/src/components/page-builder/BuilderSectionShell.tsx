'use client'

import { Reorder, useDragControls } from 'framer-motion'
import {
  ChevronDown, ChevronUp, Copy, Eye, EyeOff, GripVertical, Trash2,
} from 'lucide-react'
import BuilderAddSectionButton from '@/components/page-builder/BuilderAddSectionButton'
import { usePageBuilder } from '@/components/page-builder/PageBuilderProvider'
import { SECTION_TYPES } from '@/lib/page-builder/types'
import type { Section } from '@/lib/page-builder/types'

export default function BuilderSectionShell({
  section,
  index,
  total,
  children,
}: {
  section: Section
  index: number
  total: number
  children: React.ReactNode
}) {
  const controls = useDragControls()
  const {
    selectedSectionId,
    selectSection,
    addSection,
    duplicateSection,
    deleteSection,
    toggleHidden,
    moveSection,
  } = usePageBuilder()

  const selected = selectedSectionId === section.id
  const meta = SECTION_TYPES[section.type]

  return (
    <Reorder.Item
      value={section}
      dragListener={false}
      dragControls={controls}
      className="relative group/builder-section"
    >
      <div
        className={`relative transition-all duration-150 ${
          selected
            ? 'z-10 outline outline-2 outline-yoga-400 outline-offset-[-2px]'
            : 'outline outline-1 outline-transparent group-hover/builder-section:outline-yoga-200 outline-offset-[-1px]'
        } ${section.hidden ? 'opacity-50' : ''}`}
        onClick={(event) => {
          event.stopPropagation()
          if (event.target === event.currentTarget) {
            selectSection(section.id)
          }
        }}
      >
        <div
          className={`absolute left-1/2 top-0 z-30 flex -translate-x-1/2 -translate-y-full items-center gap-0.5 rounded-t-xl bg-sacred-950 px-2 py-1 text-white shadow-2xl transition-opacity ${
            selected ? 'opacity-100' : 'pointer-events-none opacity-0 group-hover/builder-section:pointer-events-auto group-hover/builder-section:opacity-100'
          }`}
        >
          <button
            type="button"
            onPointerDown={(event) => controls.start(event)}
            className="cursor-grab rounded p-1 text-sacred-300 transition-colors hover:text-white active:cursor-grabbing"
            title="Drag to reorder"
          >
            <GripVertical size={13} />
          </button>
          <span className="px-1 text-xs text-sacred-300">{meta.label}</span>
          <Divider />
          <button
            type="button"
            disabled={index === 0}
            onClick={(event) => {
              event.stopPropagation()
              moveSection(section.id, 'up')
            }}
            className="rounded p-1 text-sacred-300 transition-colors hover:text-white disabled:opacity-30"
            title="Move up"
          >
            <ChevronUp size={13} />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={(event) => {
              event.stopPropagation()
              moveSection(section.id, 'down')
            }}
            className="rounded p-1 text-sacred-300 transition-colors hover:text-white disabled:opacity-30"
            title="Move down"
          >
            <ChevronDown size={13} />
          </button>
          <Divider />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              toggleHidden(section.id)
            }}
            className="rounded p-1 text-sacred-300 transition-colors hover:text-white"
            title={section.hidden ? 'Show section' : 'Hide section'}
          >
            {section.hidden ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              duplicateSection(section.id)
            }}
            className="rounded p-1 text-sacred-300 transition-colors hover:text-white"
            title="Duplicate section"
          >
            <Copy size={13} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              deleteSection(section.id)
            }}
            className="rounded p-1 text-sacred-300 transition-colors hover:text-red-300"
            title="Delete section"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {children}
      </div>

      <BuilderAddSectionButton onAdd={(type) => addSection(type, section.id)} />
    </Reorder.Item>
  )
}

function Divider() {
  return <div className="mx-0.5 h-4 w-px bg-white/15" />
}
