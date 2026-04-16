'use client'

import { useReducer, useState, useCallback, useEffect, useRef, use } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Reorder } from 'framer-motion'
import { ArrowLeft, Save, Globe, Undo2, Redo2 } from 'lucide-react'
import { pagesApi } from '@/lib/api'
import type { SitePage } from '@/types'

import type { Section, SectionType, SectionStyle } from './_builder/types'
import { makeSection, pageDefaultSections } from './_builder/defaults'
import { uid } from './_builder/helpers'
import SectionBlock from './_builder/SectionBlock'
import AddSectionButton from './_builder/AddSectionButton'
import InspectorPanel from './_builder/InspectorPanel'
import RichTextToolbar from './_builder/RichTextToolbar'

// ── History reducer ───────────────────────────────────────────────────────────

type HistoryAction =
  | { type: 'PUSH'; sections: Section[] }
  | { type: 'REPLACE'; sections: Section[] }   // replace HEAD without creating a new entry
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET'; sections: Section[] }

interface HistoryState {
  past: Section[][]
  present: Section[]
  future: Section[][]
}

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'PUSH':
      return {
        past: [...state.past, state.present].slice(-50),
        present: action.sections,
        future: [],
      }
    case 'REPLACE':
      return { ...state, present: action.sections }
    case 'UNDO':
      if (state.past.length === 0) return state
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
      }
    case 'REDO':
      if (state.future.length === 0) return state
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
      }
    case 'RESET':
      return { past: [], present: action.sections, future: [] }
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PageEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()

  const [history, dispatch] = useReducer(historyReducer, {
    past: [], present: [], future: [],
  })
  const sections = history.present

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const editorRootRef = useRef<HTMLElement>(null)

  // ── Data loading ──────────────────────────────────────────────────────────
  const { data: page, isLoading } = useQuery({
    queryKey: ['admin-page', id],
    queryFn: (): Promise<SitePage> => pagesApi.getPage(id).then(r => r.data.data as SitePage),
  })

  useEffect(() => {
    if (!page) return
    let initial: Section[]
    if (page.contentJson) {
      try { initial = JSON.parse(page.contentJson) }
      catch { initial = pageDefaultSections(page.slug, page.template) }
    } else {
      initial = pageDefaultSections(page.slug, page.template)
    }
    dispatch({ type: 'RESET', sections: initial })
  }, [page])

  // ── Save mutation ─────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () => pagesApi.updatePage(id, { contentJson: JSON.stringify(sections) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-page', id] })
      toast.success('Page saved')
    },
    onError: () => toast.error('Failed to save'),
  })

  // ── Debounced push timer ──────────────────────────────────────────────────
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Section operations ────────────────────────────────────────────────────

  const updateContent = useCallback((sectionId: string, key: string, value: unknown) => {
    dispatch({ type: 'REPLACE', sections: sections.map(s =>
      s.id === sectionId ? { ...s, content: { ...s.content, [key]: value } } : s
    )})
    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      dispatch({ type: 'PUSH', sections: sections.map(s =>
        s.id === sectionId ? { ...s, content: { ...s.content, [key]: value } } : s
      )})
    }, 800)
  }, [sections])

  const updateStyle = useCallback((sectionId: string, patch: Partial<SectionStyle>) => {
    dispatch({ type: 'PUSH', sections: sections.map(s =>
      s.id === sectionId ? { ...s, style: { ...s.style, ...patch } } : s
    )})
  }, [sections])

  const addSection = useCallback((type: SectionType, afterId?: string) => {
    const newSection = makeSection(type)
    let next: Section[]
    if (afterId) {
      const idx = sections.findIndex(s => s.id === afterId)
      next = [...sections.slice(0, idx + 1), newSection, ...sections.slice(idx + 1)]
    } else {
      next = [...sections, newSection]
    }
    dispatch({ type: 'PUSH', sections: next })
    setSelectedId(newSection.id)
  }, [sections])

  const deleteSection = useCallback((sectionId: string) => {
    dispatch({ type: 'PUSH', sections: sections.filter(s => s.id !== sectionId) })
    if (selectedId === sectionId) setSelectedId(null)
  }, [sections, selectedId])

  const duplicateSection = useCallback((sectionId: string) => {
    const idx = sections.findIndex(s => s.id === sectionId)
    if (idx === -1) return
    const clone = { ...sections[idx], id: uid() }
    const next = [...sections.slice(0, idx + 1), clone, ...sections.slice(idx + 1)]
    dispatch({ type: 'PUSH', sections: next })
    setSelectedId(clone.id)
  }, [sections])

  const toggleHidden = useCallback((sectionId: string) => {
    dispatch({ type: 'PUSH', sections: sections.map(s =>
      s.id === sectionId ? { ...s, hidden: !s.hidden } : s
    )})
  }, [sections])

  const moveSection = useCallback((sectionId: string, dir: 'up' | 'down') => {
    const idx = sections.findIndex(s => s.id === sectionId)
    if (idx === -1) return
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === sections.length - 1) return
    const next = [...sections]
    const target = dir === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[target]] = [next[target], next[idx]]
    dispatch({ type: 'PUSH', sections: next })
  }, [sections])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); dispatch({ type: 'UNDO' }) }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); dispatch({ type: 'REDO' }) }
      if (mod && e.key === 's') { e.preventDefault(); saveMutation.mutate() }
      if (e.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [saveMutation, setSelectedId])

  const selectedSection = sections.find(s => s.id === selectedId) ?? null

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-sm text-gray-400">
        Loading page…
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* ── Top bar ── */}
      <header className="bg-white border-b border-gray-200 px-4 h-12 flex items-center gap-3 shrink-0 z-20">
        <button
          onClick={() => router.push('/admin/pages')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={15} />
          Pages
        </button>

        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-800 truncate">{page?.title}</span>
          <span className="ml-2 text-xs text-gray-400 font-mono">/{page?.slug}</span>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => dispatch({ type: 'UNDO' })}
            disabled={history.past.length === 0}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={() => dispatch({ type: 'REDO' })}
            disabled={history.future.length === 0}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <Redo2 size={15} />
          </button>
        </div>

        <div className="w-px h-5 bg-gray-200" />

        <a
          href={`/${page?.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Globe size={13} />
          Preview
        </a>

        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-yoga-700 text-white text-xs font-medium rounded-lg hover:bg-yoga-800 transition-colors disabled:opacity-60"
        >
          <Save size={13} />
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </button>
      </header>

      {/* ── Body: canvas + inspector ── */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas */}
        <main
          ref={editorRootRef as React.RefObject<HTMLDivElement>}
          className="flex-1 overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) setSelectedId(null) }}
        >
          <RichTextToolbar editorRoot={editorRootRef} />

          {/* Page canvas */}
          <div className="min-h-full bg-white shadow-lg mx-auto max-w-5xl my-4">
            {sections.length === 0 && (
              <div className="py-16 text-center">
                <AddSectionButton onAdd={type => addSection(type)} primary />
              </div>
            )}

            <Reorder.Group
              axis="y"
              values={sections}
              onReorder={next => dispatch({ type: 'PUSH', sections: next })}
              className="outline-none"
            >
              {sections.map((section, i) => (
                <SectionBlock
                  key={section.id}
                  section={section}
                  selected={selectedId === section.id}
                  onSelect={() => setSelectedId(section.id)}
                  onUpdate={(key, value) => updateContent(section.id, key, value)}
                  onDuplicate={() => duplicateSection(section.id)}
                  onDelete={() => deleteSection(section.id)}
                  onToggleHidden={() => toggleHidden(section.id)}
                  onMoveUp={() => moveSection(section.id, 'up')}
                  onMoveDown={() => moveSection(section.id, 'down')}
                  onAddAfter={type => addSection(type, section.id)}
                  isFirst={i === 0}
                  isLast={i === sections.length - 1}
                />
              ))}
            </Reorder.Group>
          </div>
        </main>

        {/* Inspector */}
        <InspectorPanel
          section={selectedSection}
          onUpdate={(key, value) => selectedId && updateContent(selectedId, key, value)}
          onUpdateStyle={patch => selectedId && updateStyle(selectedId, patch)}
          onDuplicate={() => selectedId && duplicateSection(selectedId)}
          onDelete={() => selectedId && deleteSection(selectedId)}
          onToggleHidden={() => selectedId && toggleHidden(selectedId)}
        />
      </div>
    </div>
  )
}

