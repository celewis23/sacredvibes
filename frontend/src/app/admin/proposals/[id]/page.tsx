'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import { ArrowLeft, Download, Eye } from 'lucide-react'
import Link from 'next/link'
import { proposalsApi } from '@/lib/api'
import ProposalBannerEditor from '@/components/admin/proposal/ProposalBannerEditor'
import ProposalBodyEditor from '@/components/admin/proposal/ProposalBodyEditor'
import ProposalLineItemsEditor from '@/components/admin/proposal/ProposalLineItemsEditor'
import type { ProposalBannerFields, ProposalLineItem } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ errors?: string[]; message?: string }>
  return axiosError.response?.data?.errors?.[0] ?? axiosError.response?.data?.message ?? fallback
}

const STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-sacred-100 text-sacred-600',
  Sent: 'bg-green-100 text-green-700',
}

export default function ProposalEditorPage({ params }: Props) {
  const { id } = use(params)
  const isNew = id === 'new'
  const router = useRouter()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [header, setHeader] = useState<ProposalBannerFields>({})
  const [bodyContentHtml, setBodyContentHtml] = useState('')
  const [footer, setFooter] = useState<ProposalBannerFields>({})
  const [lineItems, setLineItems] = useState<ProposalLineItem[]>([])
  const [coverNote, setCoverNote] = useState('')
  const [testEmail, setTestEmail] = useState('')

  const { data: proposal, isLoading } = useQuery({
    queryKey: ['proposal', id],
    queryFn: () => proposalsApi.get(id).then(r => r.data.data),
    enabled: !isNew,
  })

  const { data: previewHtml } = useQuery({
    queryKey: ['proposal-preview', id],
    queryFn: () => proposalsApi.preview(id).then(r => r.data.data?.html ?? ''),
    enabled: !isNew && tab === 'preview',
  })

  useEffect(() => {
    if (!proposal) return
    setTitle(proposal.title)
    setSubject(proposal.subject)
    setRecipientName(proposal.recipientName)
    setRecipientEmail(proposal.recipientEmail)
    setHeader(proposal.header)
    setBodyContentHtml(proposal.bodyContentHtml)
    setFooter(proposal.footer)
    setLineItems(proposal.lineItems)
  }, [proposal])

  const isLocked = proposal?.status === 'Sent'

  const createMutation = useMutation({
    mutationFn: () => proposalsApi.create({ title }),
    onSuccess: (res) => {
      if (res.data.data) router.replace(`/admin/proposals/${res.data.data.id}`)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not create proposal')),
  })

  const saveMutation = useMutation({
    mutationFn: () => proposalsApi.update(id, {
      title, subject, recipientName, recipientEmail, header, bodyContentHtml, footer,
      lineItems: lineItems.map((li, index) => ({
        description: li.description, price: li.price, sortOrder: index, serviceOfferingId: li.serviceOfferingId,
      })),
    }),
    onSuccess: () => {
      toast.success('Saved')
      queryClient.invalidateQueries({ queryKey: ['proposal', id] })
      queryClient.invalidateQueries({ queryKey: ['proposal-preview', id] })
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not save proposal')),
  })

  const sendMutation = useMutation({
    mutationFn: async () => {
      await saveMutation.mutateAsync()
      return proposalsApi.send(id, { coverNote: coverNote || undefined })
    },
    onSuccess: () => {
      toast.success('Proposal sent')
      queryClient.invalidateQueries({ queryKey: ['proposal', id] })
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not send proposal')),
  })

  const sendTestMutation = useMutation({
    mutationFn: async () => {
      await saveMutation.mutateAsync()
      return proposalsApi.sendTest(id, testEmail)
    },
    onSuccess: () => toast.success('Test email sent'),
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not send test email')),
  })

  if (isNew) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-6">
        <Link href="/admin/proposals" className="inline-flex items-center gap-1.5 text-sm text-sacred-500 hover:text-sacred-900">
          <ArrowLeft size={15} /> Proposals
        </Link>
        <div className="bg-white border border-sacred-200 rounded-xl p-5 space-y-4">
          <h1 className="text-lg font-semibold text-sacred-900">New Proposal</h1>
          <div>
            <label className="block text-xs font-medium text-sacred-700 mb-1.5">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Retreat Package for Jane Doe"
              className="w-full px-3 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
            />
          </div>
          <p className="text-xs text-sacred-400">
            Your letterhead and footer will carry over from your most recent proposal, so you can pick up right where you left off.
          </p>
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !title.trim()}
            className="w-full px-4 py-2.5 bg-yoga-600 text-white text-sm font-medium rounded-lg hover:bg-yoga-700 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating…' : 'Create & Continue'}
          </button>
        </div>
      </div>
    )
  }

  if (isLoading || !proposal) {
    return <div className="max-w-3xl mx-auto p-6 text-sm text-sacred-400">Loading…</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 pb-24">
      <Link href="/admin/proposals" className="inline-flex items-center gap-1.5 text-sm text-sacred-500 hover:text-sacred-900">
        <ArrowLeft size={15} /> Proposals
      </Link>

      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-semibold text-sacred-900 truncate">{proposal.title}</h1>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[proposal.status]}`}>
          {proposal.status}
        </span>
        {proposal.status === 'Sent' && (
          <span className="shrink-0 flex items-center gap-1 text-xs text-sacred-400">
            <Eye size={13} /> Viewed {proposal.viewCount} time{proposal.viewCount === 1 ? '' : 's'}
          </span>
        )}
        <a
          href={proposalsApi.pdfUrl(id)}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs border border-sacred-200 text-sacred-700 rounded-lg hover:bg-sacred-50"
        >
          <Download size={14} /> Download PDF
        </a>
      </div>

      {isLocked && (
        <p className="text-sm text-sacred-500 bg-sacred-50 border border-sacred-100 rounded-lg px-3 py-2">
          This proposal has already been sent and can no longer be edited.
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
          <iframe srcDoc={previewHtml || ''} className="w-full h-[700px] border-0" title="Proposal preview" />
        </div>
      ) : (
        <>
          <div className="bg-white border border-sacred-200 rounded-xl p-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-sacred-700 mb-1.5">Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={isLocked}
                className="w-full px-3 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400 disabled:bg-sacred-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-sacred-700 mb-1.5">Subject Line (for the email)</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                disabled={isLocked}
                className="w-full px-3 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400 disabled:bg-sacred-50"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-sacred-700 mb-1.5">Client Name</label>
                <input
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  disabled={isLocked}
                  className="w-full px-3 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400 disabled:bg-sacred-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-sacred-700 mb-1.5">Client Email</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  disabled={isLocked}
                  className="w-full px-3 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400 disabled:bg-sacred-50"
                />
              </div>
            </div>
          </div>

          <fieldset disabled={isLocked} className="space-y-6 disabled:opacity-60">
            <ProposalBannerEditor role="header" value={header} onChange={setHeader} />
            <div>
              <h3 className="text-sm font-semibold text-sacred-900 mb-2">Content</h3>
              <ProposalBodyEditor value={bodyContentHtml} onChange={setBodyContentHtml} />
            </div>
            <ProposalLineItemsEditor value={lineItems} onChange={setLineItems} />
            <ProposalBannerEditor role="footer" value={footer} onChange={setFooter} />
          </fieldset>

          {!isLocked && (
            <div className="bg-white border border-sacred-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-sacred-900">Send</h3>
              <div>
                <label className="block text-xs font-medium text-sacred-700 mb-1.5">Cover Note (optional)</label>
                <textarea
                  value={coverNote}
                  onChange={e => setCoverNote(e.target.value)}
                  placeholder="A short personal note to include above the proposal link…"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="min-w-56 flex-1 px-3 py-2 border border-sacred-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
                />
                <button
                  onClick={() => sendTestMutation.mutate()}
                  disabled={sendTestMutation.isPending || !testEmail.trim()}
                  className="px-3 py-2 border border-sacred-200 text-sacred-700 text-sm rounded-lg hover:bg-sacred-50 disabled:opacity-50"
                >
                  {sendTestMutation.isPending ? 'Sending…' : 'Send Test to Myself'}
                </button>
              </div>
              <button
                onClick={() => {
                  if (window.confirm(`Send this proposal to ${recipientEmail || 'the client'}? This can't be undone.`)) {
                    sendMutation.mutate()
                  }
                }}
                disabled={sendMutation.isPending || !recipientEmail.trim() || !subject.trim()}
                className="w-full px-4 py-2.5 bg-yoga-600 text-white text-sm font-medium rounded-lg hover:bg-yoga-700 disabled:opacity-50"
              >
                {sendMutation.isPending ? 'Sending…' : 'Send Proposal'}
              </button>
            </div>
          )}

          {!isLocked && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-sacred-200 px-6 py-3 flex justify-end">
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !title.trim()}
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
