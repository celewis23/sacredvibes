'use client'

import { useCallback, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Save, X } from 'lucide-react'
import { usePageEditor } from '@/components/page-editor/PageEditorProvider'

export default function PageEditorToolbar() {
  const editor = usePageEditor()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const exitEditMode = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete('edit')
    nextParams.delete('pageId')
    const query = nextParams.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const handleSave = useCallback(async () => {
    const didSave = await editor.save()
    if (didSave) {
      exitEditMode()
    }
  }, [editor, exitEditMode])

  const handleCancel = useCallback(() => {
    editor.cancel()
    exitEditMode()
  }, [editor, exitEditMode])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey

      if (mod && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void handleSave()
      }

      if (event.key === 'Escape' && !editor.editingFieldKey) {
        event.preventDefault()
        handleCancel()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [editor.editingFieldKey, handleCancel, handleSave])

  return (
    <div className="fixed right-4 top-20 z-50 flex items-center gap-3 rounded-2xl border border-sacred-200 bg-white/95 px-4 py-3 shadow-soft backdrop-blur">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sacred-400">Edit Mode</p>
        <p className="text-sm text-sacred-700">
          {editor.isSaving
            ? 'Saving…'
            : editor.isDirty
              ? `${editor.changedFields.length} unsaved change${editor.changedFields.length === 1 ? '' : 's'}`
              : editor.lastSavedAt
                ? `Saved ${editor.lastSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                : 'Click any heading or paragraph to edit'}
        </p>
      </div>

      <button
        type="button"
        onClick={handleCancel}
        className="rounded-xl border border-sacred-200 px-3 py-2 text-sm font-medium text-sacred-600 transition-colors hover:bg-sacred-50"
      >
        <span className="inline-flex items-center gap-1.5">
          <X size={14} />
          Cancel
        </span>
      </button>

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={editor.isSaving}
        className="rounded-xl bg-yoga-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-yoga-800 disabled:opacity-60"
      >
        <span className="inline-flex items-center gap-1.5">
          <Save size={14} />
          Save
        </span>
      </button>
    </div>
  )
}
