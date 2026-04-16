'use client'

import { useSearchParams } from 'next/navigation'
import PageEditorProvider from '@/components/page-editor/PageEditorProvider'
import PageEditorToolbar from '@/components/page-editor/PageEditorToolbar'
import PageSectionRenderer from '@/components/sections/PageSectionRenderer'
import type { PageBuilderLiveData } from '@/lib/page-builder/types'
import type { SitePage } from '@/types'

export default function EditablePageSections({
  page,
  liveData,
}: {
  page: SitePage
  liveData?: PageBuilderLiveData
}) {
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('edit') === '1' && searchParams.get('pageId') === page.id

  if (!isEditMode) {
    return <PageSectionRenderer contentJson={page.contentJson} liveData={liveData} />
  }

  return (
    <PageEditorProvider page={page} liveData={liveData}>
      <PageSectionRenderer liveData={liveData} />
      <PageEditorToolbar />
    </PageEditorProvider>
  )
}
