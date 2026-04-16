'use client'

import { use, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, Globe, Monitor, Redo2, Save, Smartphone, Tablet, Undo2 } from 'lucide-react'
import BuilderAddSectionButton from '@/components/page-builder/BuilderAddSectionButton'
import BuilderInspector from '@/components/page-builder/BuilderInspector'
import { PageBuilderProvider } from '@/components/page-builder/PageBuilderProvider'
import BuilderRichTextToolbar from '@/components/page-builder/BuilderRichTextToolbar'
import PageSectionRenderer from '@/components/sections/PageSectionRenderer'
import { apiClient } from '@/lib/api/client'
import { pagesApi, offeringsApi } from '@/lib/api'
import { pageDefaultSections } from '@/lib/page-builder/defaults'
import { makeSection } from '@/lib/page-builder/defaults'
import { parseSections, uid } from '@/lib/page-builder/helpers'
import type {
  BuilderFieldSelection,
  BuilderViewport,
  PageBuilderLiveData,
  Section,
  SectionStyle,
  SectionType,
} from '@/lib/page-builder/types'
import { getBrandBasePath } from '@/lib/brand/resolution'
import type { ApiResponse, Asset, EventOffering, Gallery, GalleryItem, ServiceOffering, SitePage } from '@/types'

type HistoryAction =
  | { type: 'PUSH'; sections: Section[] }
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
        past: [...state.past, state.present].slice(-75),
        present: action.sections,
        future: [],
      }
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
      return {
        past: [],
        present: action.sections,
        future: [],
      }
  }
}

export default function PageEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const canvasRef = useRef<HTMLDivElement>(null)

  const [history, dispatch] = useReducer(historyReducer, {
    past: [],
    present: [],
    future: [],
  })
  const sections = history.present

  const [viewport, setViewport] = useState<BuilderViewport>('desktop')
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [selectedField, setSelectedField] = useState<BuilderFieldSelection | null>(null)
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'saved'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const lastLoadedRef = useRef<string>('')
  const lastSavedContentRef = useRef<string>('')
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestSectionsRef = useRef<Section[]>([])

  const { data: page, isLoading } = useQuery({
    queryKey: ['admin-page', id],
    queryFn: (): Promise<SitePage> => pagesApi.getPage(id).then((response) => response.data.data as SitePage),
  })

  const { data: services = [] } = useQuery({
    queryKey: ['builder-services', page?.brandId],
    enabled: Boolean(page?.brandId),
    queryFn: () =>
      offeringsApi.getServices({ brandId: page!.brandId, includeInactive: true }).then((response) => response.data.data ?? []),
  })

  const { data: events = [] } = useQuery({
    queryKey: ['builder-events', page?.brandId],
    enabled: Boolean(page?.brandId),
    queryFn: () =>
      offeringsApi.getEvents({ brandId: page!.brandId, includeInactive: true }).then((response) => response.data.data ?? []),
  })

  const { data: galleryAssets = [] } = useQuery({
    queryKey: ['builder-gallery-assets', page?.brandId],
    enabled: Boolean(page?.brandId),
    queryFn: async () => {
      const galleriesResponse = await apiClient.get<ApiResponse<Gallery[]>>('/galleries', {
        params: { brandId: page!.brandId, isActive: true },
      })

      const galleries = galleriesResponse.data.data ?? []
      const items = await Promise.all(
        galleries.map((gallery) =>
          apiClient.get<ApiResponse<GalleryItem[]>>(`/galleries/${gallery.id}/items`).then((response) => response.data.data ?? []),
        ),
      )

      return items.flat().map((item) => item.asset).filter(Boolean)
    },
  })

  useEffect(() => {
    if (!page) return

    const fromServer = page.contentJson?.trim()
    const parsed = fromServer
      ? parseSections(fromServer)
      : pageDefaultSections(page.slug, page.template)
    const initial = parsed.length > 0 ? parsed : pageDefaultSections(page.slug, page.template)
    const serialized = JSON.stringify(initial)

    if (serialized === lastLoadedRef.current) return

    lastLoadedRef.current = serialized
    lastSavedContentRef.current = serialized
    latestSectionsRef.current = initial
    dispatch({ type: 'RESET', sections: initial })
    setSaveState('idle')
    setSelectedSectionId(null)
    setSelectedField(null)
    setEditingFieldKey(null)
  }, [page])

  useEffect(() => {
    latestSectionsRef.current = sections
  }, [sections])

  const previewHref = useMemo(() => {
    if (!page) return '/'
    const basePath = getBrandBasePath(page.brandSlug as Parameters<typeof getBrandBasePath>[0]) || ''
    if (page.slug === 'home') return basePath || '/'
    return `${basePath}/${page.slug}`.replace(/\/+/g, '/')
  }, [page])

  const liveData = useMemo<PageBuilderLiveData>(() => ({
    services: services as ServiceOffering[],
    events: events as EventOffering[],
    galleryAssets: galleryAssets as Asset[],
  }), [events, galleryAssets, services])

  const persistMutation = useMutation({
    mutationFn: async ({ nextStatus }: { nextStatus?: SitePage['status'] }) => {
      const serialized = JSON.stringify(latestSectionsRef.current)
      return pagesApi.updatePage(id, {
        contentJson: serialized,
        status: nextStatus ?? page?.status,
      })
    },
    onMutate: () => {
      setSaveState('saving')
    },
    onSuccess: (_, variables) => {
      const serialized = JSON.stringify(latestSectionsRef.current)
      lastSavedContentRef.current = serialized
      lastLoadedRef.current = serialized
      setSaveState('saved')
      setLastSavedAt(new Date())
      queryClient.invalidateQueries({ queryKey: ['admin-page', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] })
      toast.success(variables.nextStatus === 'Published' ? 'Page published' : 'Draft saved')
    },
    onError: () => {
      setSaveState('dirty')
      toast.error('Unable to save changes')
    },
  })

  function pushSections(nextSections: Section[]) {
    latestSectionsRef.current = nextSections
    dispatch({ type: 'PUSH', sections: nextSections })
  }

  function updateField(sectionId: string, field: string, value: unknown) {
    pushSections(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, content: { ...section.content, [field]: value } }
          : section,
      ),
    )
  }

  function updateStyle(sectionId: string, patch: Partial<SectionStyle>) {
    pushSections(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, style: { ...section.style, ...patch } }
          : section,
      ),
    )
  }

  function reorderSections(nextSections: Section[]) {
    pushSections(nextSections)
  }

  function addSection(type: SectionType, afterId?: string) {
    const createdSection = makeSection(type)
    if (!afterId) {
      pushSections([...sections, createdSection])
    } else {
      const index = sections.findIndex((section) => section.id === afterId)
      const nextSections = [
        ...sections.slice(0, index + 1),
        createdSection,
        ...sections.slice(index + 1),
      ]
      pushSections(nextSections)
    }
    setSelectedSectionId(createdSection.id)
    setSelectedField(null)
  }

  function duplicateSection(sectionId: string) {
    const index = sections.findIndex((section) => section.id === sectionId)
    if (index === -1) return
    const clone: Section = {
      ...sections[index],
      id: uid(),
      content: { ...sections[index].content },
      style: { ...sections[index].style },
    }
    pushSections([
      ...sections.slice(0, index + 1),
      clone,
      ...sections.slice(index + 1),
    ])
    setSelectedSectionId(clone.id)
    setSelectedField(null)
  }

  function deleteSection(sectionId: string) {
    pushSections(sections.filter((section) => section.id !== sectionId))
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null)
      setSelectedField(null)
    }
  }

  function toggleHidden(sectionId: string) {
    pushSections(
      sections.map((section) =>
        section.id === sectionId ? { ...section, hidden: !section.hidden } : section,
      ),
    )
  }

  function moveSection(sectionId: string, dir: 'up' | 'down') {
    const index = sections.findIndex((section) => section.id === sectionId)
    if (index === -1) return
    if (dir === 'up' && index === 0) return
    if (dir === 'down' && index === sections.length - 1) return

    const nextSections = [...sections]
    const targetIndex = dir === 'up' ? index - 1 : index + 1
    ;[nextSections[index], nextSections[targetIndex]] = [nextSections[targetIndex], nextSections[index]]
    pushSections(nextSections)
  }

  function replaceImage(sectionId: string, field: string, currentValue?: string) {
    const nextValue = window.prompt('Enter an image URL', currentValue ?? '')
    if (nextValue === null) return
    updateField(sectionId, field, nextValue)
  }

  function selectSection(sectionId: string | null) {
    setSelectedSectionId(sectionId)
    if (!sectionId) {
      setSelectedField(null)
      setEditingFieldKey(null)
    }
  }

  function selectField(selection: BuilderFieldSelection | null) {
    setSelectedField(selection)
    setSelectedSectionId(selection?.sectionId ?? null)
  }

  function beginEditingField(selection: BuilderFieldSelection) {
    setSelectedField(selection)
    setSelectedSectionId(selection.sectionId)
    setEditingFieldKey(`${selection.sectionId}:${selection.field}`)
  }

  function endEditingField() {
    setEditingFieldKey(null)
  }

  useEffect(() => {
    const serialized = JSON.stringify(sections)
    if (!serialized || serialized === lastSavedContentRef.current) {
      if (saveState !== 'saving') setSaveState(lastSavedContentRef.current ? 'saved' : 'idle')
      return
    }

    setSaveState('dirty')
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(() => {
      persistMutation.mutate({})
    }, 1500)

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
  }, [persistMutation, saveState, sections])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey

      if (mod && event.key.toLowerCase() === 's') {
        event.preventDefault()
        persistMutation.mutate({})
        return
      }

      if (mod && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault()
        dispatch({ type: 'UNDO' })
        return
      }

      if (mod && (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))) {
        event.preventDefault()
        dispatch({ type: 'REDO' })
        return
      }

      if (event.key === 'Escape') {
        if (editingFieldKey) {
          setEditingFieldKey(null)
        } else {
          setSelectedField(null)
          setSelectedSectionId(null)
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [editingFieldKey, persistMutation])

  const viewportClassName = viewport === 'mobile'
    ? 'max-w-[390px]'
    : viewport === 'tablet'
      ? 'max-w-[820px]'
      : 'max-w-none'

  if (isLoading || !page) {
    return (
      <div className="flex h-screen items-center justify-center bg-sacred-50 text-sm text-sacred-400">
        Loading visual builder…
      </div>
    )
  }

  return (
    <PageBuilderProvider
      value={{
        enabled: true,
        sections,
        liveData,
        viewport,
        selectedSectionId,
        selectedField,
        editingFieldKey,
        selectSection,
        selectField,
        beginEditingField,
        endEditingField,
        updateField,
        updateStyle,
        reorderSections,
        addSection,
        duplicateSection,
        deleteSection,
        toggleHidden,
        moveSection,
        replaceImage,
      }}
    >
      <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-sacred-100">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-sacred-200 bg-white px-4">
          <button
            type="button"
            onClick={() => router.push('/admin/pages')}
            className="flex items-center gap-1.5 text-sm text-sacred-500 transition-colors hover:text-sacred-800"
          >
            <ArrowLeft size={15} />
            Pages
          </button>

          <div className="h-5 w-px bg-sacred-200" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sacred-900">{page.title}</p>
            <p className="truncate text-xs text-sacred-400">/{page.slug}</p>
          </div>

          <div className="hidden items-center gap-1 rounded-full border border-sacred-200 bg-sacred-50 p-1 md:flex">
            <ViewportButton label="Desktop" active={viewport === 'desktop'} onClick={() => setViewport('desktop')} icon={<Monitor size={14} />} />
            <ViewportButton label="Tablet" active={viewport === 'tablet'} onClick={() => setViewport('tablet')} icon={<Tablet size={14} />} />
            <ViewportButton label="Mobile" active={viewport === 'mobile'} onClick={() => setViewport('mobile')} icon={<Smartphone size={14} />} />
          </div>

          <div className="hidden items-center gap-1 md:flex">
            <ToolbarButton disabled={history.past.length === 0} onClick={() => dispatch({ type: 'UNDO' })} title="Undo">
              <Undo2 size={15} />
            </ToolbarButton>
            <ToolbarButton disabled={history.future.length === 0} onClick={() => dispatch({ type: 'REDO' })} title="Redo">
              <Redo2 size={15} />
            </ToolbarButton>
          </div>

          <div className="hidden text-xs text-sacred-500 lg:block">
            {saveState === 'saving' && 'Saving draft…'}
            {saveState === 'dirty' && 'Unsaved changes'}
            {saveState === 'saved' && lastSavedAt && `Saved ${lastSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
          </div>

          <a
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-sacred-200 px-3 py-1.5 text-xs font-medium text-sacred-600 transition-colors hover:bg-sacred-50"
          >
            <Globe size={13} />
            Preview
          </a>

          <button
            type="button"
            onClick={() => persistMutation.mutate({})}
            disabled={persistMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-yoga-200 bg-yoga-50 px-3 py-1.5 text-xs font-medium text-yoga-700 transition-colors hover:bg-yoga-100 disabled:opacity-60"
          >
            <Save size={13} />
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => persistMutation.mutate({ nextStatus: 'Published' })}
            disabled={persistMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-yoga-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-yoga-800 disabled:opacity-60"
          >
            <CheckCircle2 size={13} />
            Publish
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          <main
            className="min-h-0 flex-1 overflow-y-auto"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                selectSection(null)
              }
            }}
          >
            <BuilderRichTextToolbar editorRoot={canvasRef} />

            <div className="min-h-full p-4 md:p-6">
              <div className={`mx-auto transition-all duration-300 ${viewportClassName}`} ref={canvasRef}>
                {sections.length === 0 ? (
                  <div className="rounded-[2rem] bg-white p-10 shadow-soft">
                    <BuilderAddSectionButton primary onAdd={addSection} />
                  </div>
                ) : (
                  <PageSectionRenderer sections={sections} liveData={liveData} />
                )}
              </div>
            </div>
          </main>

          <BuilderInspector />
        </div>
      </div>
    </PageBuilderProvider>
  )
}

function ToolbarButton({
  disabled,
  onClick,
  title,
  children,
}: {
  disabled?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg p-2 text-sacred-500 transition-colors hover:bg-sacred-100 hover:text-sacred-800 disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  )
}

function ViewportButton({
  label,
  active,
  icon,
  onClick,
}: {
  label: string
  active: boolean
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'bg-white text-yoga-700 shadow-sm'
          : 'text-sacred-500 hover:text-sacred-800'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
