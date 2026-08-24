'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { newslettersApi, newsletterTemplatesApi, emailApi } from '@/lib/api'
import NewsletterBannerEditor from '@/components/admin/newsletter/NewsletterBannerEditor'
import NewsletterBodyEditor from '@/components/admin/newsletter/NewsletterBodyEditor'
import NewsletterAudienceScheduler from '@/components/admin/newsletter/NewsletterAudienceScheduler'
import type { NewsletterBannerFields } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ errors?: string[]; message?: string }>
  return axiosError.response?.data?.errors?.[0] ?? axiosError.response?.data?.message ?? fallback
}

const STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-sacred-100 text-sacred-600',
  Scheduled: 'bg-yoga-100 text-yoga-700',
  Sending: 'bg-amber-100 text-amber-700',
  Sent: 'bg-green-100 text-green-700',
  SentWithErrors: 'bg-amber-100 text-amber-700',
  Failed: 'bg-red-100 text-red-700',
  Cancelled: 'bg-sacred-100 text-sacred-500',
}

export default function NewsletterEditorPage({ params }: Props) {
  const { id } = use(params)
  const isNew = id === 'new'
  const router = useRouter()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [header, setHeader] = useState<NewsletterBannerFields>({})
  const [bodyContentHtml, setBodyContentHtml] = useState('')
  const [footer, setFooter] = useState<NewsletterBannerFields>({})

  const { data: templates = [] } = useQuery({
    queryKey: ['newsletter-templates'],
    queryFn: () => newsletterTemplatesApi.getAll().then(r => r.data.data ?? []),
    enabled: isNew,
  })

  const { data: groups = [] } = useQuery({
    queryKey: ['email-recipient-groups'],
    queryFn: () => emailApi.getRecipientGroups().then(r => r.data.data ?? []),
    enabled: !isNew,
  })

  const { data: newsletter, isLoading } = useQuery({
    queryKey: ['newsletter', id],
    queryFn: () => newslettersApi.get(id).then(r => r.data.data),
    enabled: !isNew,
  })

  const { data: previewHtml } = useQuery({
    queryKey: ['newsletter-preview', id],
    queryFn: () => newslettersApi.preview(id).then(r => r.data.data?.html ?? ''),
    enabled: !isNew && tab === 'preview',
  })

  useEffect(() => {
    if (!newsletter) return
    setName(newsletter.name)
    setSubject(newsletter.subject)
    setHeader(newsletter.header)
    setBodyContentHtml(newsletter.bodyContentHtml)
    setFooter(newsletter.footer)
  }, [newsletter])

  const isLocked = newsletter?.status === 'Sending' || newsletter?.status === 'Sent' || newsletter?.status === 'SentWithErrors'

  const createMutation = useMutation({
    mutationFn: () => newslettersApi.create({ name, subject, templateId: templateId || undefined }),
    onSuccess: (res) => {
      if (res.data.data) router.replace(`/admin/newsletters/${res.data.data.id}`)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not create newsletter')),
  })

  const saveMutation = useMutation({
    mutationFn: () => newslettersApi.update(id, { name, subject, header, bodyContentHtml, footer }),
    onSuccess: () => {
      toast.success('Saved')
      queryClient.invalidateQueries({ queryKey: ['newsletter', id] })
      queryClient.invalidateQueries({ queryKey: ['newsletter-preview', id] })
      queryClient.invalidateQueries({ queryKey: ['newsletters'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not save newsletter')),
  })

  const scheduleMutation = useMutation({
    mutationFn: (vars: { recipientGroupId: string; scheduledAtUtc: string }) => newslettersApi.schedule(id, vars),
    onSuccess: () => {
      toast.success('Newsletter scheduled')
      queryClient.invalidateQueries({ queryKey: ['newsletter', id] })
      queryClient.invalidateQueries({ queryKey: ['newsletters'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not schedule newsletter')),
  })

  const cancelMutation = useMutation({
    mutationFn: () => newslettersApi.cancel(id),
    onSuccess: () => {
      toast.success('Schedule cancelled')
      queryClient.invalidateQueries({ queryKey: ['newsletter', id] })
      queryClient.invalidateQueries({ queryKey: ['newsletters'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not cancel')),
  })

  const sendNowMutation = useMutation({
    mutationFn: (recipientGroupId: string) => newslettersApi.sendNow(id, { recipientGroupId }),
    onSuccess: () => {
      toast.success('Sending now')
      queryClient.invalidateQueries({ queryKey: ['newsletter', id] })
      queryClient.invalidateQueries({ queryKey: ['newsletters'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not send newsletter')),
  })

  const sendTestMutation = useMutation({
    mutationFn: (testEmail: string) => newslettersApi.sendTest(id, testEmail),
    onSuccess: () => toast.success('Test email sent'),
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not send test email')),
  })

  if (isNew) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-6">
        <Link href="/admin/newsletters" className="inline-flex items-center gap-1.5 text-sm text-sacred-500 hover:text-sacred-900">
          <ArrowLeft size={15} /> Newsletters
        </Link>
        <div className="bg-white border border-sacred-200 rounded-xl p-5 space-y-4">
          <h1 className="text-lg font-semibold text-sacred-900">New Newsletter</h1>
          <div>
            <label className="block text-xs font-medium text-sacred-700 mb-1.5">Internal Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. August Retreat Announcement"
              className="w-full px-3 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-sacred-700 mb-1.5">Subject Line</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="What subscribers will see in their inbox"
              className="w-full px-3 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-sacred-700 mb-1.5">Start From</label>
            <select
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
            >
              <option value="">Blank newsletter</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !name.trim()}
            className="w-full px-4 py-2.5 bg-yoga-600 text-white text-sm font-medium rounded-lg hover:bg-yoga-700 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating…' : 'Create & Continue'}
          </button>
        </div>
      </div>
    )
  }

  if (isLoading || !newsletter) {
    return <div className="max-w-3xl mx-auto p-6 text-sm text-sacred-400">Loading…</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 pb-24">
      <Link href="/admin/newsletters" className="inline-flex items-center gap-1.5 text-sm text-sacred-500 hover:text-sacred-900">
        <ArrowLeft size={15} /> Newsletters
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-sacred-900 truncate">{newsletter.name}</h1>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[newsletter.status]}`}>
          {newsletter.status === 'SentWithErrors' ? 'Sent (with errors)' : newsletter.status}
        </span>
      </div>
      {newsletter.failureReason && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{newsletter.failureReason}</p>
      )}
      {isLocked && (
        <p className="text-sm text-sacred-500 bg-sacred-50 border border-sacred-100 rounded-lg px-3 py-2">
          This newsletter has already gone out and can no longer be edited.
        </p>
      )}

      <div className="flex gap-1 border-b border-sacred-200">
        {(['edit', 'preview'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              tab === t ? 'border-yoga-600 text-yoga-700' : 'border-transparent text-sacred-500 hover:text-sacred-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'preview' ? (
        <div className="bg-white border border-sacred-200 rounded-xl overflow-hidden">
          <iframe srcDoc={previewHtml || ''} className="w-full h-[700px] border-0" title="Newsletter preview" />
        </div>
      ) : (
        <>
          <div className="bg-white border border-sacred-200 rounded-xl p-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-sacred-700 mb-1.5">Internal Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isLocked}
                className="w-full px-3 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400 disabled:bg-sacred-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-sacred-700 mb-1.5">Subject Line</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                disabled={isLocked}
                className="w-full px-3 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400 disabled:bg-sacred-50"
              />
            </div>
          </div>

          <fieldset disabled={isLocked} className="space-y-6 disabled:opacity-60">
            <NewsletterBannerEditor role="header" value={header} onChange={setHeader} />
            <div>
              <h3 className="text-sm font-semibold text-sacred-900 mb-2">Content</h3>
              <NewsletterBodyEditor value={bodyContentHtml} onChange={setBodyContentHtml} />
            </div>
            <NewsletterBannerEditor role="footer" value={footer} onChange={setFooter} />
          </fieldset>

          <NewsletterAudienceScheduler
            newsletter={newsletter}
            groups={groups}
            onSchedule={(groupId, iso) => scheduleMutation.mutate({ recipientGroupId: groupId, scheduledAtUtc: iso })}
            onSendNow={(groupId) => sendNowMutation.mutate(groupId)}
            onCancel={() => cancelMutation.mutate()}
            onSendTest={(email) => sendTestMutation.mutate(email)}
            isBusy={scheduleMutation.isPending || cancelMutation.isPending || sendNowMutation.isPending || sendTestMutation.isPending}
          />

          {!isLocked && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-sacred-200 px-6 py-3 flex justify-end">
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !name.trim()}
                className="px-5 py-2.5 bg-yoga-600 text-white text-sm font-medium rounded-lg hover:bg-yoga-700 disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving…' : 'Save Draft'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
