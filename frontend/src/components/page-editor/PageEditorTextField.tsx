'use client'

import EditableText from '@/components/page-editor/EditableText'
import { useOptionalPageEditor } from '@/components/page-editor/PageEditorProvider'

export default function PageEditorTextField({
  sectionId,
  field,
  fallback,
  as = 'div',
  className = '',
  richText = false,
  multiline = true,
  label,
}: {
  sectionId: string
  field: string
  fallback: string
  as?: React.ComponentProps<typeof EditableText>['as']
  className?: string
  richText?: boolean
  multiline?: boolean
  label?: string
}) {
  const editor = useOptionalPageEditor()
  const currentValue = editor
    ? readEditorValue(editor.sections, sectionId, field) ?? fallback
    : fallback

  return (
    <EditableText
      sectionId={sectionId}
      field={field}
      value={currentValue}
      as={as}
      className={className}
      richText={richText}
      multiline={multiline}
      label={label}
    />
  )
}

function readEditorValue(sections: { id: string; content: Record<string, unknown> }[], sectionId: string, field: string) {
  const value = sections.find((section) => section.id === sectionId)?.content?.[field]
  return typeof value === 'string' ? value : undefined
}
