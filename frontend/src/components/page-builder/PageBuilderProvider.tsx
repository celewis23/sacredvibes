'use client'

import { createContext, useContext } from 'react'
import type {
  BuilderFieldSelection,
  BuilderViewport,
  PageBuilderLiveData,
  Section,
  SectionStyle,
  SectionType,
} from '@/lib/page-builder/types'

export interface PageBuilderContextValue {
  enabled: boolean
  sections: Section[]
  liveData: PageBuilderLiveData
  viewport: BuilderViewport
  selectedSectionId: string | null
  selectedField: BuilderFieldSelection | null
  editingFieldKey: string | null
  selectSection: (sectionId: string | null) => void
  selectField: (selection: BuilderFieldSelection | null) => void
  beginEditingField: (selection: BuilderFieldSelection) => void
  endEditingField: () => void
  updateField: (sectionId: string, field: string, value: unknown) => void
  updateStyle: (sectionId: string, patch: Partial<SectionStyle>) => void
  reorderSections: (sections: Section[]) => void
  addSection: (type: SectionType, afterId?: string) => void
  duplicateSection: (sectionId: string) => void
  deleteSection: (sectionId: string) => void
  toggleHidden: (sectionId: string) => void
  moveSection: (sectionId: string, dir: 'up' | 'down') => void
  replaceImage: (sectionId: string, field: string, currentValue?: string) => void
}

const PageBuilderContext = createContext<PageBuilderContextValue | null>(null)

export function PageBuilderProvider({
  value,
  children,
}: {
  value: PageBuilderContextValue
  children: React.ReactNode
}) {
  return (
    <PageBuilderContext.Provider value={value}>
      {children}
    </PageBuilderContext.Provider>
  )
}

export function usePageBuilder() {
  const ctx = useContext(PageBuilderContext)
  if (!ctx) {
    throw new Error('usePageBuilder must be used within PageBuilderProvider')
  }
  return ctx
}

export function useOptionalPageBuilder() {
  return useContext(PageBuilderContext)
}
