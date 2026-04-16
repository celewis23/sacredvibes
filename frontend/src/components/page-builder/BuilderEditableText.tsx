'use client'

import { createElement, useCallback, useEffect, useMemo, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import type { JSX as ReactJSX } from 'react'
import { usePageBuilder } from '@/components/page-builder/PageBuilderProvider'
import type { BuilderFieldKind } from '@/lib/page-builder/types'

interface BuilderEditableTextProps {
  sectionId: string
  field: string
  value: string
  onChange: (value: string) => void
  as?: keyof ReactJSX.IntrinsicElements
  className?: string
  placeholder?: string
  richText?: boolean
  multiline?: boolean
  kind?: BuilderFieldKind
  label?: string
}

export default function BuilderEditableText({
  sectionId,
  field,
  value,
  onChange,
  as = 'div',
  className = '',
  placeholder = 'Click to edit…',
  richText = false,
  multiline = true,
  kind = richText ? 'rich-text' : 'text',
  label,
}: BuilderEditableTextProps) {
  const {
    selectedField,
    editingFieldKey,
    selectField,
    beginEditingField,
    endEditingField,
  } = usePageBuilder()

  const ref = useRef<HTMLElement>(null)
  const fieldKey = `${sectionId}:${field}`
  const isSelected = selectedField?.sectionId === sectionId && selectedField.field === field
  const isEditing = editingFieldKey === fieldKey

  useEffect(() => {
    if (!ref.current || isEditing) return
    if (richText) {
      if (ref.current.innerHTML !== value) ref.current.innerHTML = value
    } else {
      if (ref.current.innerText !== value) ref.current.innerText = value
    }
  }, [isEditing, richText, value])

  useEffect(() => {
    if (!ref.current) return
    if (isEditing) {
      ref.current.focus()
      placeCaretAtEnd(ref.current)
    } else {
      ref.current.blur()
    }
  }, [isEditing])

  const commit = useCallback(() => {
    if (!ref.current) return
    const next = richText ? ref.current.innerHTML : ref.current.innerText
    if (next !== value) onChange(next)
  }, [onChange, richText, value])

  const selection = useMemo(() => ({
    sectionId,
    field,
    kind,
    label,
  }), [field, kind, label, sectionId])

  return createElement(as, {
    ref,
    contentEditable: isEditing,
    suppressContentEditableWarning: true,
    spellCheck: isEditing,
    tabIndex: 0,
    'data-placeholder': placeholder,
    'data-builder-field-key': fieldKey,
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation()
      selectField(selection)
    },
    onDoubleClick: (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation()
      selectField(selection)
      beginEditingField(selection)
    },
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      event.stopPropagation()
    },
    onBlur: () => {
      commit()
      endEditingField()
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (!isEditing && event.key === 'Enter') {
        event.preventDefault()
        beginEditingField(selection)
        return
      }

      if (!multiline && event.key === 'Enter') {
        event.preventDefault()
        commit()
        endEditingField()
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        commit()
        endEditingField()
      }
    },
    className: `builder-editable outline-none transition-all empty:before:content-[attr(data-placeholder)] empty:before:text-current empty:before:opacity-30 ${
      isSelected ? 'ring-2 ring-yoga-400 ring-offset-4 ring-offset-transparent' : 'hover:ring-1 hover:ring-yoga-200'
    } ${isEditing ? 'cursor-text' : 'cursor-pointer'} ${className}`,
  })
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
