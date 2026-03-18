'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapLink from '@tiptap/extension-link'
import TiptapImage from '@tiptap/extension-image'
import TiptapPlaceholder from '@tiptap/extension-placeholder'
import { toast } from 'sonner'
import { blogApi } from '@/lib/api'
import type { ContentStatus } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

const STATUSES: ContentStatus[] = ['Draft', 'Published', 'Scheduled', 'Archived']

function TiptapToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  const btn = (label: string, action: () => void, active?: boolean) => (
    <button
      key={label}
      onMouseDown={e => { e.preventDefault(); action() }}
      className={`px-2 py-1 text-xs rounded transition-colors ${
        active ? 'bg-sacred-800 text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50">
      {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
      {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
      {btn('S', () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}
      <div className="w-px h-4 bg-gray-300 mx-1" />
      {btn('H1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
      {btn('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
      {btn('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
      <div className="w-px h-4 bg-gray-300 mx-1" />
      {btn('UL', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
      {btn('OL', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
      {btn('BQ', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
      {btn('Code', () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive('codeBlock'))}
      <div className="w-px h-4 bg-gray-300 mx-1" />
      {btn('---', () => editor.chain().focus().setHorizontalRule().run())}
      {btn('Link', () => {
        const url = window.prompt('URL')
        if (url) editor.chain().focus().setLink({ href: url }).run()
      }, editor.isActive('link'))}
      {btn('Img', () => {
        const url = window.prompt('Image URL')
        if (url) editor.chain().focus().setImage({ src: url }).run()
      })}
      <div className="w-px h-4 bg-gray-300 mx-1" />
      {btn('Undo', () => editor.chain().focus().undo().run())}
      {btn('Redo', () => editor.chain().focus().redo().run())}
    </div>
  )
}

export default function BlogEditorPage({ params }: Props) {
  const { id } = use(params)
  const isNew = id === 'new'
  const router = useRouter()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [status, setStatus] = useState<ContentStatus>('Draft')
  const [publishedAt, setPublishedAt] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [brandId, setBrandId] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const { data: post, isLoading } = useQuery({
    queryKey: ['admin-blog-post', id],
    queryFn: () => blogApi.adminGetPost(id).then(r => r.data.data),
    enabled: !isNew,
  })

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapLink.configure({ openOnClick: false }),
      TiptapImage,
      TiptapPlaceholder.configure({ placeholder: 'Write your post content here...' }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sacred max-w-none min-h-[400px] p-4 focus:outline-none',
      },
    },
  })

  // Populate form when post loads
  useEffect(() => {
    if (post && editor) {
      setTitle(post.title)
      setSlug(post.slug)
      setExcerpt(post.excerpt ?? '')
      setStatus(post.status)
      setPublishedAt(post.publishedAt ? post.publishedAt.slice(0, 16) : '')
      setSeoTitle(post.seoTitle ?? '')
      setSeoDescription(post.seoDescription ?? '')
      setBrandId(post.brandId)
      setSlugManuallyEdited(true)
      editor.commands.setContent(post.content ?? '')
    }
  }, [post, editor])

  // Auto-generate slug from title on new posts
  useEffect(() => {
    if (!isNew || slugManuallyEdited) return
    const generated = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setSlug(generated)
  }, [title, isNew, slugManuallyEdited])

  const saveMutation = useMutation({
    mutationFn: (data: unknown) =>
      isNew
        ? blogApi.adminCreatePost(data).then(r => r.data.data)
        : blogApi.adminUpdatePost(id, data).then(r => r.data.data),
    onSuccess: (saved) => {
      toast.success(isNew ? 'Post created' : 'Post saved')
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] })
      if (isNew && saved?.id) {
        router.replace(`/admin/blog/${saved.id}`)
      }
    },
    onError: () => toast.error('Failed to save post'),
  })

  const handleSave = () => {
    saveMutation.mutate({
      title,
      slug,
      excerpt: excerpt || undefined,
      content: editor?.getHTML() ?? '',
      status,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : undefined,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
      brandId: brandId || undefined,
    })
  }

  if (!isNew && isLoading) {
    return <div className="p-8 text-center text-gray-400 text-sm">Loading post...</div>
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push('/admin/blog')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-1 flex items-center gap-1"
          >
            ← Back to posts
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isNew ? 'New Post' : 'Edit Post'}
          </h1>
        </div>
        <div className="flex gap-3">
          <select
            value={status}
            onChange={e => setStatus(e.target.value as ContentStatus)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending || !title.trim()}
            className="px-5 py-2 bg-sacred-800 text-white text-sm rounded-lg hover:bg-sacred-900 disabled:opacity-50 transition-colors"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-5">
          {/* Title */}
          <div>
            <input
              type="text"
              placeholder="Post title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-2xl font-semibold border-0 border-b border-gray-200 pb-3 focus:outline-none focus:border-sacred-500 placeholder-gray-300"
            />
          </div>

          {/* Slug */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 shrink-0">Slug:</span>
            <input
              type="text"
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugManuallyEdited(true) }}
              className="flex-1 text-sm text-gray-600 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sacred-500"
            />
          </div>

          {/* Rich text editor */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <TiptapToolbar editor={editor} />
            <EditorContent editor={editor} />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
            <textarea
              rows={3}
              placeholder="Brief summary shown in post listings..."
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sacred-500"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Publish settings */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Publish Settings</h3>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ContentStatus)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {(status === 'Published' || status === 'Scheduled') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {status === 'Scheduled' ? 'Publish At' : 'Published At'}
                </label>
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={e => setPublishedAt(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
                />
              </div>
            )}
          </div>

          {/* SEO */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">SEO</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">SEO Title</label>
              <input
                type="text"
                placeholder="Defaults to post title"
                value={seoTitle}
                onChange={e => setSeoTitle(e.target.value)}
                maxLength={70}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
              />
              <p className="text-xs text-gray-400 mt-1">{seoTitle.length}/70</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Meta Description</label>
              <textarea
                rows={3}
                placeholder="Defaults to excerpt"
                value={seoDescription}
                onChange={e => setSeoDescription(e.target.value)}
                maxLength={160}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sacred-500"
              />
              <p className="text-xs text-gray-400 mt-1">{seoDescription.length}/160</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
