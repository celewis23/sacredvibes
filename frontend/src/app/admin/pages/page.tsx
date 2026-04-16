'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Link from 'next/link'
import { Plus, Pencil, Trash2, X, Layout } from 'lucide-react'
import { pagesApi } from '@/lib/api'
import { toBrandPath } from '@/lib/brand/resolution'
import type { SitePage } from '@/types'

type FormState = {
  brandId: string
  title: string
  slug: string
  heroTitle: string
  heroSubtitle: string
  seoTitle: string
  seoDescription: string
  status: string
  showInNav: boolean
  navLabel: string
  navSortOrder: string
  template: string
}

// Primary brand — Sacred Vibes Healing & Wellness
const PRIMARY_BRAND_ID = '11111111-1111-1111-1111-111111111111'

const emptyForm: FormState = {
  brandId: PRIMARY_BRAND_ID,
  title: '',
  slug: '',
  heroTitle: '',
  heroSubtitle: '',
  seoTitle: '',
  seoDescription: '',
  status: 'Draft',
  showInNav: false,
  navLabel: '',
  navSortOrder: '0',
  template: 'default',
}

const STATUS_COLORS: Record<string, string> = {
  Published: 'bg-green-100 text-green-700',
  Draft: 'bg-yellow-100 text-yellow-600',
  Scheduled: 'bg-blue-100 text-blue-700',
  Archived: 'bg-gray-100 text-gray-500',
}

export default function AdminPagesPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<SitePage | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['admin-pages'],
    queryFn: () => pagesApi.getPages({ brandId: PRIMARY_BRAND_ID }).then(r => r.data.data ?? []),
  })

  const saveMutation = useMutation({
    mutationFn: (data: unknown) => editing
      ? pagesApi.updatePage(editing.id, data)
      : pagesApi.createPage(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pages'] })
      toast.success(editing ? 'Page updated' : 'Page created')
      closeModal()
    },
    onError: () => toast.error('Failed to save page'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pagesApi.deletePage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pages'] })
      toast.success('Page deleted')
      setDeleteConfirm(null)
    },
    onError: () => toast.error('Failed to delete page'),
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(p: SitePage) {
    setEditing(p)
    setForm({
      brandId: p.brandId,
      title: p.title,
      slug: p.slug,
      heroTitle: p.heroTitle ?? '',
      heroSubtitle: p.heroSubtitle ?? '',
      seoTitle: p.seoTitle ?? '',
      seoDescription: p.seoDescription ?? '',
      status: p.status,
      showInNav: p.showInNav,
      navLabel: p.navLabel ?? '',
      navSortOrder: p.navSortOrder.toString(),
      template: p.template ?? 'default',
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(null)
    setForm(emptyForm)
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    saveMutation.mutate({
      brandId: form.brandId,
      title: form.title,
      slug: form.slug || undefined,
      heroTitle: form.heroTitle || undefined,
      heroSubtitle: form.heroSubtitle || undefined,
      seoTitle: form.seoTitle || undefined,
      seoDescription: form.seoDescription || undefined,
      status: form.status,
      showInNav: form.showInNav,
      navLabel: form.navLabel || undefined,
      navSortOrder: parseInt(form.navSortOrder) || 0,
      template: form.template || 'default',
    })
  }

  function set(key: keyof FormState, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pages</h1>
          <p className="text-sm text-gray-500 mt-1">{pages.length} page{pages.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-yoga-700 text-white rounded-xl text-sm font-medium hover:bg-yoga-800 transition-colors"
        >
          <Plus size={16} />
          New Page
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-400 text-sm">Loading...</div>
      ) : pages.length === 0 ? (
        <div className="p-12 text-center text-gray-400 text-sm">No pages found.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs">Page</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs">Slug</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs">Template</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs">Status</th>
                <th className="px-4 py-2.5 text-right font-medium text-gray-600 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pages.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-900">{p.title}</div>
                    {p.heroTitle && <div className="text-xs text-gray-400 truncate max-w-xs">{p.heroTitle}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">/{p.slug}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{p.template ?? 'default'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={getInlineEditHref(p)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-yoga-700 border border-yoga-200 rounded-lg hover:bg-yoga-50 transition-colors font-medium" title="Open inline page editor">
                        <Layout size={12} /> Edit
                      </Link>
                      <button onClick={() => openEdit(p)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded" title="Edit settings">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteConfirm(p.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit / Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white h-full w-full max-w-lg overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
              <h2 className="font-semibold text-gray-900">{editing ? 'Edit Page' : 'New Page'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 p-5 space-y-4">

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Page Title *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500" />
              </div>

              {!editing && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Slug</label>
                  <input value={form.slug} onChange={e => set('slug', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yoga-500"
                    placeholder="auto-generated" />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Template</label>
                <select value={form.template} onChange={e => set('template', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500">
                  {['default', 'home', 'booking', 'sound-on-the-river', 'gallery', 'blog', 'contact'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-3">Hero Content</p>
                <div className="space-y-3">
                  <input value={form.heroTitle} onChange={e => set('heroTitle', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                    placeholder="Hero headline" />
                  <input value={form.heroSubtitle} onChange={e => set('heroSubtitle', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                    placeholder="Hero subtitle" />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-3">SEO</p>
                <div className="space-y-3">
                  <input value={form.seoTitle} onChange={e => set('seoTitle', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                    placeholder="SEO title" />
                  <textarea value={form.seoDescription} onChange={e => set('seoDescription', e.target.value)} rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500 resize-none"
                    placeholder="Meta description" />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-3">Navigation</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.showInNav} onChange={e => set('showInNav', e.target.checked)}
                      className="rounded border-gray-300 text-yoga-600 focus:ring-yoga-500" />
                    <span className="text-sm text-gray-700">Show in navigation</span>
                  </label>
                  {form.showInNav && (
                    <div className="grid grid-cols-2 gap-3">
                      <input value={form.navLabel} onChange={e => set('navLabel', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                        placeholder="Nav label" />
                      <input type="number" value={form.navSortOrder} onChange={e => set('navSortOrder', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                        placeholder="Sort order" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500">
                  {['Draft', 'Published', 'Archived'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </form>

            <div className="p-5 border-t border-gray-200 flex justify-end gap-3 shrink-0">
              <button onClick={closeModal} type="button"
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={saveMutation.isPending}
                className="px-5 py-2 bg-yoga-700 text-white rounded-xl text-sm font-medium hover:bg-yoga-800 transition-colors disabled:opacity-50">
                {saveMutation.isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create Page'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4 w-full">
            <h3 className="font-semibold text-gray-900 mb-2">Delete page?</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteConfirm)} disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getInlineEditHref(page: SitePage) {
  const normalizedSlug = page.slug.replace(/^\/+/, '')
  const pathname = normalizedSlug === 'home'
    ? toBrandPath(page.brandSlug as Parameters<typeof toBrandPath>[0], '/')
    : toBrandPath(page.brandSlug as Parameters<typeof toBrandPath>[0], `/${normalizedSlug}`)

  return `${pathname}?edit=1&pageId=${page.id}`
}
