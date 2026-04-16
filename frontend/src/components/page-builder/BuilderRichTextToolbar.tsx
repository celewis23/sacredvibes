'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bold, Italic, Underline, Link as LinkIcon, Unlink,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Eraser,
} from 'lucide-react'

export default function BuilderRichTextToolbar({
  editorRoot,
}: {
  editorRoot: React.RefObject<HTMLElement | null>
}) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const toolbarRef = useRef<HTMLDivElement>(null)

  const reposition = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setVisible(false)
      return
    }

    const range = selection.getRangeAt(0)
    const container =
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement
        : (range.commonAncestorContainer as HTMLElement)

    const editable = container?.closest('[contenteditable="true"]')
    if (!editable || (editorRoot.current && !editorRoot.current.contains(editable))) {
      setVisible(false)
      return
    }

    const rect = range.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      setVisible(false)
      return
    }

    setPosition({
      top: rect.top + window.scrollY - 52,
      left: rect.left + window.scrollX + (rect.width / 2),
    })
    setVisible(true)
  }, [editorRoot])

  useEffect(() => {
    document.addEventListener('selectionchange', reposition)
    return () => document.removeEventListener('selectionchange', reposition)
  }, [reposition])

  function exec(command: string, value?: string) {
    document.execCommand(command, false, value)
  }

  function wrapWithFontSize(size: string) {
    document.execCommand('fontSize', false, size)
  }

  function handleLink() {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    const anchor = selection.anchorNode?.parentElement?.closest('a')
    if (anchor) {
      exec('unlink')
      return
    }

    const url = window.prompt('Enter URL', 'https://')
    if (url) exec('createLink', url)
  }

  if (!visible) return null

  return (
    <div
      ref={toolbarRef}
      onMouseDown={(event) => event.preventDefault()}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
        zIndex: 1000,
      }}
      className="flex items-center gap-0.5 rounded-xl bg-sacred-950 px-2 py-1.5 text-white shadow-2xl"
    >
      <ToolButton title="Bold" onClick={() => exec('bold')}><Bold size={13} /></ToolButton>
      <ToolButton title="Italic" onClick={() => exec('italic')}><Italic size={13} /></ToolButton>
      <ToolButton title="Underline" onClick={() => exec('underline')}><Underline size={13} /></ToolButton>
      <Divider />
      <ToolButton title="Align left" onClick={() => exec('justifyLeft')}><AlignLeft size={13} /></ToolButton>
      <ToolButton title="Align center" onClick={() => exec('justifyCenter')}><AlignCenter size={13} /></ToolButton>
      <ToolButton title="Align right" onClick={() => exec('justifyRight')}><AlignRight size={13} /></ToolButton>
      <Divider />
      <ToolButton title="Bulleted list" onClick={() => exec('insertUnorderedList')}><List size={13} /></ToolButton>
      <ToolButton title="Numbered list" onClick={() => exec('insertOrderedList')}><ListOrdered size={13} /></ToolButton>
      <Divider />
      <ToolButton title="Add or remove link" onClick={handleLink}><LinkIcon size={13} /></ToolButton>
      <ToolButton title="Remove link" onClick={() => exec('unlink')}><Unlink size={13} /></ToolButton>
      <Divider />
      <label className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] text-sacred-200 hover:bg-white/10">
        <span className="uppercase tracking-wide">Size</span>
        <select
          defaultValue="3"
          onChange={(event) => wrapWithFontSize(event.target.value)}
          className="bg-transparent text-[11px] text-white outline-none"
        >
          <option value="2" className="text-black">S</option>
          <option value="3" className="text-black">M</option>
          <option value="4" className="text-black">L</option>
          <option value="5" className="text-black">XL</option>
        </select>
      </label>
      <label className="flex items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-white/10">
        <span className="text-[11px] uppercase tracking-wide text-sacred-200">Color</span>
        <input
          type="color"
          title="Text color"
          defaultValue="#ffffff"
          onInput={(event) => exec('foreColor', (event.target as HTMLInputElement).value)}
          className="h-4 w-4 cursor-pointer rounded border-0 bg-transparent p-0"
        />
      </label>
      <Divider />
      <ToolButton title="Remove formatting" onClick={() => exec('removeFormat')}><Eraser size={13} /></ToolButton>
    </div>
  )
}

function ToolButton({
  title,
  onClick,
  children,
}: {
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="rounded-lg p-1.5 text-white transition-colors hover:bg-white/10"
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-0.5 h-4 w-px bg-white/15" />
}
