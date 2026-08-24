'use client'

import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2, LayoutTemplate } from 'lucide-react'
import { newsletterTemplatesApi } from '@/lib/api'

export default function NewsletterTemplatesPage() {
  const queryClient = useQueryClient()

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['newsletter-templates'],
    queryFn: () => newsletterTemplatesApi.getAll().then(r => r.data.data ?? []),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => newsletterTemplatesApi.delete(id),
    onSuccess: () => {
      toast.success('Template deleted')
      queryClient.invalidateQueries({ queryKey: ['newsletter-templates'] })
    },
    onError: () => toast.error('Could not delete template'),
  })

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-sacred-900">Newsletter Templates</h1>
          <p className="text-sm text-sacred-500 mt-1">Reusable starting points for new newsletters — colors, images, and layout, no coding needed.</p>
        </div>
        <Link
          href="/admin/newsletter-templates/new"
          className="flex items-center gap-2 px-4 py-2 bg-yoga-600 text-white text-sm font-medium rounded-lg hover:bg-yoga-700"
        >
          <Plus size={16} /> New Template
        </Link>
      </div>

      {isLoading ? (
        <div className="text-sm text-sacred-400">Loading…</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-sacred-200 rounded-xl">
          <LayoutTemplate className="mx-auto mb-3 text-sacred-300" size={32} />
          <p className="text-sm text-sacred-500">No templates yet. Create one to speed up future newsletters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white border border-sacred-200 rounded-xl p-4 flex flex-col gap-2">
              <div
                className="h-16 rounded-lg -mx-1"
                style={{ backgroundColor: t.header.backgroundColor || '#5f5248' }}
              />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/admin/newsletter-templates/${t.id}`} className="font-medium text-sacred-900 hover:underline truncate block">
                    {t.name}
                  </Link>
                  {t.description && <p className="text-xs text-sacred-500 truncate">{t.description}</p>}
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${t.name}"? This won't affect newsletters already created from it.`)) {
                      deleteMutation.mutate(t.id)
                    }
                  }}
                  className="shrink-0 text-sacred-400 hover:text-red-600 p-1"
                  title="Delete template"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
