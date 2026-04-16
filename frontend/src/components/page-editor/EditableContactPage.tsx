'use client'

import { useSearchParams } from 'next/navigation'
import ContactForm from '@/components/forms/ContactForm'
import EditableText from '@/components/page-editor/EditableText'
import PageEditorProvider, { useOptionalPageEditor } from '@/components/page-editor/PageEditorProvider'
import PageEditorToolbar from '@/components/page-editor/PageEditorToolbar'
import { parseSections } from '@/lib/page-builder/helpers'
import type { Section } from '@/lib/page-builder/types'
import type { SitePage } from '@/types'

export default function EditableContactPage({
  page,
  brandId,
  headingFallback,
  subheadingFallback,
  infoFallback,
}: {
  page: SitePage
  brandId: string
  headingFallback: string
  subheadingFallback: string
  infoFallback: string
}) {
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('edit') === '1' && searchParams.get('pageId') === page.id

  if (!isEditMode) {
    return (
      <ContactPageBody
        page={page}
        brandId={brandId}
        headingFallback={headingFallback}
        subheadingFallback={subheadingFallback}
        infoFallback={infoFallback}
      />
    )
  }

  return (
    <PageEditorProvider page={page}>
      <ContactPageBody
        page={page}
        brandId={brandId}
        headingFallback={headingFallback}
        subheadingFallback={subheadingFallback}
        infoFallback={infoFallback}
      />
      <PageEditorToolbar />
    </PageEditorProvider>
  )
}

export function ContactPageBody({
  page,
  brandId,
  headingFallback,
  subheadingFallback,
  infoFallback,
}: {
  page?: SitePage | null
  brandId: string
  headingFallback: string
  subheadingFallback: string
  infoFallback: string
}) {
  const editor = useOptionalPageEditor()
  const sections = editor?.sections ?? resolveSections(page)
  const headingSection = sections.find((section) => section.type === 'heading') ?? null
  const textSection = sections.find((section) => section.type === 'text') ?? null

  const headingSectionId = headingSection?.id ?? 'contact-heading'
  const textSectionId = textSection?.id ?? 'contact-text'
  const heading = readString(headingSection, 'headline') || headingFallback
  const subheading = readString(headingSection, 'subheading') || subheadingFallback
  const infoText = readString(textSection, 'body') || infoFallback

  return (
    <main className="section">
      <div className="container-sacred">
        <div className="mx-auto max-w-4xl">
          <div className="grid items-start gap-12 md:grid-cols-2">
            <div>
              <EditableText
                sectionId={headingSectionId}
                field="headline"
                value={heading}
                as="h1"
                multiline={false}
                label="Contact headline"
                className="mb-4 font-heading text-4xl text-sacred-900 md:text-5xl"
              />
              <EditableText
                sectionId={headingSectionId}
                field="subheading"
                value={subheading}
                as="p"
                label="Contact subheading"
                className="mb-8 text-lg leading-relaxed text-sacred-600"
              />
              <EditableText
                sectionId={textSectionId}
                field="body"
                value={infoText}
                as="p"
                label="Contact info"
                className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-sacred-600"
              />
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-widest text-sacred-400">Email</p>
                <a href="mailto:info@sacredvibesyoga.com" className="text-sm text-sacred-700 underline underline-offset-2 hover:text-sacred-900">
                  info@sacredvibesyoga.com
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-sacred-100 bg-white p-8 shadow-soft">
              <ContactForm brandId={brandId} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function resolveSections(page?: SitePage | null): Section[] {
  return parseSections(page?.contentJson)
}

function readString(section: Section | null, field: string) {
  const value = section?.content?.[field]
  return typeof value === 'string' ? value : ''
}
