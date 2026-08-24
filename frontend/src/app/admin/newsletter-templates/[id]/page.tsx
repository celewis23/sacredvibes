'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { newsletterTemplatesApi } from '@/lib/api'
import NewsletterBannerEditor from '@/components/admin/newsletter/NewsletterBannerEditor'
import NewsletterBodyEditor from '@/components/admin/newsletter/NewsletterBodyEditor'
import type { NewsletterBannerFields } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default function NewsletterTemplateEditorPage({ params }: Props) {
  const { id } = use(params)
  const isNew = id === 'new'
  const router = useRouter()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [header, setHeader] = useState<NewsletterBannerFields>({})
  const [bodyContentHtml, setBodyContentHtml] = useState('')
  const [footer, setFooter] = useState<NewsletterBannerFields>({})

  const { data: template, isLoading } = useQuery({
    queryKey: ['newsletter-template', id],
    queryFn: () => newsletterTemplatesApi.get(id).then(r => r.data.data),
    enabled: !isNew,
  })

  useEffect(() => {
    if (!template) return
    setName(template.name)
    setDescription(template.description ?? '')
    setHeader(template.header)
    setBodyContentHtml(template.bodyContentHtml)
    setFooter(template.footer)
  }, [template])

  const saveMutation = useMutation({
    mutationFn: () => {
      const data = { name, description, header, bodyContentHtml, footer }
      return isNew ? newsletterTemplatesApi.create(data) : newsletterTemplatesApi.update(id, data)
    },
    onSuccess: (res) => {
      toast.success('Template saved')
      queryClient.invalidateQueries({ queryKey: ['newsletter-templates'] })
      if (isNew && res.data.data) {
        router.replace(`/admin/newsletter-templates/${res.data.data.id}`)
      } else {
        queryClient.invalidateQueries({ queryKey: ['newsletter-template', id] })
      }
    },
    onError: () => toast.error('Could not save template'),
  })

  if (!isNew && isLoading) {
    return <div className="max-w-3xl mx-auto p-6 text-sm text-sacred-400">Loading…</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 pb-24">
      <Link href="/admin/newsletter-templates" className="inline-flex items-center gap-1.5 text-sm text-sacred-500 hover:text-sacred-900">
        <ArrowLeft size={15} /> Newsletter Templates
      </Link>

      <div className="bg-white border border-sacred-200 rounded-xl p-5 space-y-3">
        <div>
          <label className="block text-xs font-medium text-sacred-700 mb-1.5">Template Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Monthly Update"
            className="w-full px-3 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-sacred-700 mb-1.5">Description (optional)</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="A short note to remind yourself what this template is for"
            className="w-full px-3 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
          />
        </div>
      </div>

      <NewsletterBannerEditor role="header" value={header} onChange={setHeader} />

      <div>
        <h3 className="text-sm font-semibold text-sacred-900 mb-2">Starting Content</h3>
        <NewsletterBodyEditor value={bodyContentHtml} onChange={setBodyContentHtml} />
      </div>

      <NewsletterBannerEditor role="footer" value={footer} onChange={setFooter} />

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-sacred-200 px-6 py-3 flex justify-end">
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !name.trim()}
          className="px-5 py-2.5 bg-yoga-600 text-white text-sm font-medium rounded-lg hover:bg-yoga-700 disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save Template'}
        </button>
      </div>
    </div>
  )
}
