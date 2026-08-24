'use client'

import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapImage from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from 'lucide-react'
import AssetPicker from '@/components/admin/AssetPicker'
import { assetsApi } from '@/lib/api'

interface NewsletterBodyEditorProps {
  value: string
  onChange: (html: string) => void
}

function ToolbarButton({
  active, onClick, children, title,
}: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${
        active ? 'bg-yoga-100 text-yoga-700' : 'text-sacred-500 hover:bg-sacred-50'
      }`}
    >
      {children}
    </button>
  )
}

export default function NewsletterBodyEditor({ value, onChange }: NewsletterBodyEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TiptapImage.configure({ inline: true }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({ placeholder: 'Write what goes in this newsletter…' }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'min-h-[300px] px-4 py-3 text-sm leading-relaxed text-sacred-900 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // Keep the editor in sync when a newsletter/template loads in asynchronously after mount
  // (value arrives later than the initial empty state). Guarded by the equality check so
  // this never fights the cursor while the user is actively typing — onUpdate above keeps
  // value equal to the editor's own HTML on every keystroke, so this only fires on a real
  // external change (a different record loading in).
  useEffect(() => {
    if (!editor) return
    if (value !== editor.getHTML()) editor.commands.setContent(value || '')
  }, [value, editor])

  const insertImage = async (assetId: string | undefined) => {
    if (!assetId || !editor) return
    const res = await assetsApi.getAsset(assetId)
    const url = res.data?.data?.publicUrl
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const setLink = () => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL', previousUrl || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  if (!editor) return null

  return (
    <div className="bg-white border border-sacred-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-1 border-b border-sacred-100 px-2 py-1.5">
        <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
          <LinkIcon size={16} />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />

      <div className="border-t border-sacred-100 px-4 py-3">
        <AssetPicker label="Insert Image" accept="image" value={undefined} onChange={insertImage} />
      </div>
    </div>
  )
}
