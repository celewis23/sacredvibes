'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { pagesApi } from '@/lib/api'
import { makeSection, pageDefaultSections } from '@/lib/page-builder/defaults'
import { parseSections } from '@/lib/page-builder/helpers'
import type { BuilderFieldSelection, PageBuilderLiveData, Section } from '@/lib/page-builder/types'
import type { SitePage } from '@/types'

interface PageEditorContextValue {
  enabled: boolean
  mode: 'inline'
  page: SitePage
  sections: Section[]
  liveData: PageBuilderLiveData
  selectedField: BuilderFieldSelection | null
  editingFieldKey: string | null
  changedFields: string[]
  isDirty: boolean
  isSaving: boolean
  lastSavedAt: Date | null
  selectField: (selection: BuilderFieldSelection | null) => void
  beginEditingField: (selection: BuilderFieldSelection) => void
  endEditingField: () => void
  updateField: (sectionId: string, field: string, value: unknown) => void
  save: () => Promise<boolean>
  cancel: () => void
}

const PageEditorContext = createContext<PageEditorContextValue | null>(null)

export default function PageEditorProvider({
  page,
  initialSections,
  liveData,
  children,
}: {
  page: SitePage
  initialSections?: Section[]
  liveData?: PageBuilderLiveData
  children: React.ReactNode
}) {
  const resolvedInitialSections = useMemo(
    () => initialSections ?? resolveInitialSections(page),
    [initialSections, page],
  )
  const [sections, setSections] = useState<Section[]>(resolvedInitialSections)
  const [selectedField, setSelectedField] = useState<BuilderFieldSelection | null>(null)
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null)
  const [changedFields, setChangedFields] = useState<string[]>([])
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const latestSectionsRef = useRef<Section[]>(resolvedInitialSections)
  const savedSectionsRef = useRef<Section[]>(resolvedInitialSections)

  useEffect(() => {
    setSections(resolvedInitialSections)
    setSelectedField(null)
    setEditingFieldKey(null)
    setChangedFields([])
    latestSectionsRef.current = resolvedInitialSections
    savedSectionsRef.current = resolvedInitialSections
  }, [resolvedInitialSections])

  useEffect(() => {
    latestSectionsRef.current = sections
  }, [sections])

  const saveMutation = useMutation({
    mutationFn: async () => pagesApi.updatePage(page.id, {
      contentJson: JSON.stringify(latestSectionsRef.current),
      status: page.status,
    }),
    onSuccess: () => {
      savedSectionsRef.current = latestSectionsRef.current
      setChangedFields([])
      setLastSavedAt(new Date())
      toast.success('Page saved')
    },
    onError: () => {
      toast.error('Unable to save page')
    },
  })

  function updateField(sectionId: string, field: string, value: unknown) {
    setSections((currentSections) => {
      const nextSections = currentSections.map((section) =>
        section.id === sectionId
          ? { ...section, content: { ...section.content, [field]: value } }
          : section,
      )

      const savedValue = savedSectionsRef.current.find((section) => section.id === sectionId)?.content?.[field]
      const key = `${sectionId}:${field}`
      setChangedFields((currentKeys) => {
        const nextKeys = new Set(currentKeys)
        if (serializeFieldValue(savedValue) === serializeFieldValue(value)) {
          nextKeys.delete(key)
        } else {
          nextKeys.add(key)
        }
        return Array.from(nextKeys)
      })

      latestSectionsRef.current = nextSections
      return nextSections
    })
  }

  function selectField(selection: BuilderFieldSelection | null) {
    setSelectedField(selection)
  }

  function beginEditingField(selection: BuilderFieldSelection) {
    setSelectedField(selection)
    setEditingFieldKey(`${selection.sectionId}:${selection.field}`)
  }

  function endEditingField() {
    setEditingFieldKey(null)
  }

  async function save() {
    try {
      await saveMutation.mutateAsync()
      return true
    } catch {
      return false
    }
  }

  function cancel() {
    const restored = savedSectionsRef.current
    setSections(restored)
    latestSectionsRef.current = restored
    setChangedFields([])
    setSelectedField(null)
    setEditingFieldKey(null)
  }

  return (
    <PageEditorContext.Provider
      value={{
        enabled: true,
        mode: 'inline',
        page,
        sections,
        liveData: liveData ?? {},
        selectedField,
        editingFieldKey,
        changedFields,
        isDirty: changedFields.length > 0,
        isSaving: saveMutation.isPending,
        lastSavedAt,
        selectField,
        beginEditingField,
        endEditingField,
        updateField,
        save,
        cancel,
      }}
    >
      {children}
    </PageEditorContext.Provider>
  )
}

export function usePageEditor() {
  const ctx = useContext(PageEditorContext)
  if (!ctx) {
    throw new Error('usePageEditor must be used within PageEditorProvider')
  }
  return ctx
}

export function useOptionalPageEditor() {
  return useContext(PageEditorContext)
}

function resolveInitialSections(page: SitePage): Section[] {
  const parsed = parseSections(page.contentJson)
  if (parsed.length > 0) return parsed

  const defaults = pageDefaultSections(page.slug, page.template)
  if (defaults.length > 0) return defaults

  return [makeSection('text')]
}

function serializeFieldValue(value: unknown) {
  return typeof value === 'string' ? value : JSON.stringify(value ?? null)
}
