'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Bold, Italic, Underline, Link, Unlink } from 'lucide-react'

interface RichTextToolbarProps {
  /** The container element within which text can be selected/edited */
  editorRoot: React.RefObject<HTMLElement | null>
}

/**
 * Floating rich-text toolbar that appears on text selection.
 * Uses document.execCommand (widely supported, adequate for this use case).
 * Positioned above the selection using getBoundingClientRect.
 */
export default function RichTextToolbar({ editorRoot }: RichTextToolbarProps) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const toolbarRef = useRef<HTMLDivElement>(null)

  const reposition = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setVisible(false)
      return
    }
    // Check that selection is inside our editor root
    const range = sel.getRangeAt(0)
    if (editorRoot.current && !editorRoot.current.contains(range.commonAncestorContainer)) {
      setVisible(false)
      return
    }
    const rect = range.getBoundingClientRect()
    if (rect.width === 0) { setVisible(false); return }
    setPos({
      top: rect.top + window.scrollY - 44,
      left: rect.left + window.scrollX + rect.width / 2,
    })
    setVisible(true)
  }, [editorRoot])

  useEffect(() => {
    document.addEventListener('selectionchange', reposition)
    return () => document.removeEventListener('selectionchange', reposition)
  }, [reposition])

  // Hide when clicking outside
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (toolbarRef.current?.contains(e.target as Node)) return
      // Don't hide yet — selectionchange will fire and re-evaluate
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function exec(cmd: string, value?: string) {
    // Prevent toolbar click from blurring the contentEditable
    document.execCommand(cmd, false, value)
  }

  function handleMouseDown(e: React.MouseEvent) {
    // Prevent blur of contentEditable when clicking toolbar
    e.preventDefault()
  }

  function handleLink() {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return
    // Check if selection is already wrapped in a link
    const anchor = sel.anchorNode?.parentElement?.closest('a')
    if (anchor) {
      exec('unlink')
    } else {
      const url = window.prompt('Enter URL', 'https://')
      if (url) exec('createLink', url)
    }
  }

  if (!visible) return null

  return (
    <div
      ref={toolbarRef}
      onMouseDown={handleMouseDown}
      style={{ position: 'fixed', top: pos.top, left: pos.left, transform: 'translateX(-50%)', zIndex: 9999 }}
      className="flex items-center gap-0.5 bg-gray-900 text-white rounded-lg shadow-xl px-1.5 py-1 pointer-events-auto"
    >
      <ToolBtn onClick={() => exec('bold')} title="Bold (Ctrl+B)"><Bold size={13} /></ToolBtn>
      <ToolBtn onClick={() => exec('italic')} title="Italic (Ctrl+I)"><Italic size={13} /></ToolBtn>
      <ToolBtn onClick={() => exec('underline')} title="Underline (Ctrl+U)"><Underline size={13} /></ToolBtn>
      <div className="w-px h-4 bg-white/20 mx-0.5" />
      <ToolBtn onClick={handleLink} title="Add/remove link"><Link size={13} /></ToolBtn>
      <ToolBtn onClick={() => exec('unlink')} title="Remove link"><Unlink size={13} /></ToolBtn>
    </div>
  )
}

function ToolBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded hover:bg-white/20 transition-colors text-white"
    >
      {children}
    </button>
  )
}
