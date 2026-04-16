'use client'

import { createElement, useEffect, useMemo, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import type { JSX as ReactJSX } from 'react'
import { useOptionalPageEditor } from '@/components/page-editor/PageEditorProvider'

interface EditableTextProps {
  sectionId: string
  field: string
  value: string
  as?: keyof ReactJSX.IntrinsicElements
  className?: string
  placeholder?: string
  richText?: boolean
  multiline?: boolean
  label?: string
}

export default function EditableText({
  sectionId,
  field,
  value,
  as = 'div',
  className = '',
  placeholder = 'Click to edit…',
  richText = false,
  multiline = true,
  label,
}: EditableTextProps) {
  const editor = useOptionalPageEditor()

  if (!editor?.enabled) {
    return renderStaticText({ as, className, richText, value })
  }

  const ref = useRef<HTMLElement>(null)
  const fieldKey = `${sectionId}:${field}`
  const isSelected = editor.selectedField?.sectionId === sectionId && editor.selectedField.field === field
  const isEditing = editor.editingFieldKey === fieldKey
  const selection = useMemo(() => ({
    sectionId,
    field,
    kind: richText ? 'rich-text' : 'text',
    label,
  } as const), [field, label, richText, sectionId])

  useEffect(() => {
    if (!ref.current || isEditing) return
    if (richText) {
      if (ref.current.innerHTML !== value) ref.current.innerHTML = value
    } else if (ref.current.innerText !== value) {
      ref.current.innerText = value
    }
  }, [isEditing, richText, value])

  useEffect(() => {
    if (!ref.current || !isEditing) return
    ref.current.focus()
    placeCaretAtEnd(ref.current)
  }, [isEditing])

  return createElement(as, {
    ref,
    contentEditable: isEditing,
    suppressContentEditableWarning: true,
    spellCheck: isEditing,
    tabIndex: 0,
    'data-placeholder': placeholder,
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation()
      editor.selectField(selection)
      if (!isEditing) {
        editor.beginEditingField(selection)
      }
    },
    onBlur: () => {
      commitField(ref.current, editor, sectionId, field, value, richText)
      editor.endEditingField()
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (!multiline && event.key === 'Enter') {
        event.preventDefault()
        commitField(ref.current, editor, sectionId, field, value, richText)
        editor.endEditingField()
        return
      }

      if (!isEditing && event.key === 'Enter') {
        event.preventDefault()
        editor.beginEditingField(selection)
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        if (ref.current) {
          if (richText) {
            ref.current.innerHTML = value
          } else {
            ref.current.innerText = value
          }
        }
        editor.endEditingField()
      }
    },
    className: `outline-none transition-shadow empty:before:content-[attr(data-placeholder)] empty:before:text-current empty:before:opacity-35 ${
      isSelected ? 'ring-2 ring-yoga-400 ring-offset-2 ring-offset-white/0' : 'hover:ring-1 hover:ring-yoga-200'
    } ${isEditing ? 'cursor-text' : 'cursor-pointer'} ${className}`,
  })
}

function renderStaticText({
  as,
  className,
  richText,
  value,
}: {
  as: keyof ReactJSX.IntrinsicElements
  className: string
  richText: boolean
  value: string
}) {
  if (!value) return null

  if (richText) {
    const isHtml = value.startsWith('<') && value.includes('</')
    const Tag = as

    return isHtml ? (
      <Tag className={className} dangerouslySetInnerHTML={{ __html: value }} />
    ) : (
      <Tag className={`${className} whitespace-pre-wrap`}>{value}</Tag>
    )
  }

  const Tag = as
  return <Tag className={className}>{value}</Tag>
}

function commitField(
  element: HTMLElement | null,
  editor: NonNullable<ReturnType<typeof useOptionalPageEditor>>,
  sectionId: string,
  field: string,
  value: string,
  richText: boolean,
) {
  if (!element) return
  const nextValue = richText ? element.innerHTML : element.innerText
  if (nextValue !== value) {
    editor.updateField(sectionId, field, nextValue)
  }
}

function placeCaretAtEnd(element: HTMLElement) {
  const selection = window.getSelection()
  if (!selection) return

  const range = document.createRange()
  range.selectNodeContents(element)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}
