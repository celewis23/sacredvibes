'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { KeyboardEvent } from 'react'

interface EditableTextProps {
  value: string
  onChange: (v: string) => void
  onSelect?: () => void
  as?: string
  className?: string
  placeholder?: string
  richText?: boolean
  multiline?: boolean
}

/**
 * Inline-editable text that:
 * - Uses innerHTML so rich-text formatting (bold, italic, links) is preserved
 * - Committed-ref pattern: DOM edits never cause React re-render mid-keystroke
 * - Commits on blur only; notifies parent with onChange
 */
export default function EditableText({
  value,
  onChange,
  onSelect,
  as = 'div',
  className = '',
  placeholder = 'Click to edit…',
  richText = false,
  multiline = true,
}: EditableTextProps) {
  const ref = useRef<HTMLElement>(null)
  // Track whether the element is currently being edited to avoid clobbering DOM
  const editing = useRef(false)

  // Sync value → DOM only when not being actively edited
  useEffect(() => {
    if (!ref.current || editing.current) return
    if (richText) {
      if (ref.current.innerHTML !== value) ref.current.innerHTML = value
    } else {
      if (ref.current.innerText !== value) ref.current.innerText = value
    }
  }, [value, richText])

  const handleFocus = useCallback(() => {
    editing.current = true
    onSelect?.()
  }, [onSelect])

  const handleBlur = useCallback(() => {
    editing.current = false
    if (!ref.current) return
    const next = richText ? ref.current.innerHTML : ref.current.innerText
    if (next !== value) onChange(next)
  }, [value, richText, onChange])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLElement>) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault()
      ref.current?.blur()
    }
    // Prevent Ctrl+S / Cmd+S from being swallowed by browser
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      ref.current?.blur()
    }
  }, [multiline])

  const Tag = as as 'div'

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      data-placeholder={placeholder}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`outline-none cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-current empty:before:opacity-30 ${className}`}
    />
  )
}
