'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { emailTemplatesApi, emailApi } from '@/lib/api'

interface EmailTemplate {
  key: string
  name: string
  description: string
  subject: string
  htmlBody: string
  variables: string[]
}

const TEMPLATE_LABELS: Record<string, { icon: string; audience: 'Customer' | 'Admin' }> = {
  booking_received:  { icon: '📥', audience: 'Customer' },
  booking_confirmed: { icon: '✅', audience: 'Customer' },
  booking_cancelled: { icon: '❌', audience: 'Customer' },
  booking_updated:   { icon: '🔄', audience: 'Customer' },
  admin_new_booking: { icon: '🔔', audience: 'Admin'    },
  booking_approved_pending_payment: { icon: '💳', audience: 'Customer' },
  booking_payment_confirmed:        { icon: '🎉', audience: 'Customer' },
  booking_denied:                   { icon: '🙏', audience: 'Customer' },
  booking_rescheduled:              { icon: '🗓️', audience: 'Customer' },
}

const BLANK_LAYOUT_HTML = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#f3f0eb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f3f0eb;padding:32px 16px;">
    <tr><td>
      <table align="center" width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;">
        <tr><td style="background-color:#5f5248;padding:28px;text-align:center;color:#f3f0eb;">Your Header</td></tr>
        <tr><td style="padding:32px;color:#1c1714;font-size:15px;line-height:1.7;">{{content}}</td></tr>
        <tr><td style="background-color:#faf9f7;padding:20px;text-align:center;color:#a49280;font-size:12px;">Your Footer</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

type Kind = 'system' | 'custom'

export default function EmailTemplatesPage() {
  const queryClient = useQueryClient()
  const [kind, setKind] = useState<Kind | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  // Automated (system) templates
  const [subject, setSubject] = useState('')
  const [htmlBody, setHtmlBody] = useState('')
  const [previewEmail, setPreviewEmail] = useState('')
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [isDirty, setIsDirty] = useState(false)

  // Custom templates (shared with the compose "Layouts" picker)
  const [layoutName, setLayoutName] = useState('')
  const [layoutHtml, setLayoutHtml] = useState('')
  const [layoutIsDefault, setLayoutIsDefault] = useState(false)
  const [layoutDirty, setLayoutDirty] = useState(false)

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => emailTemplatesApi.getAll().then(r => r.data.data ?? []),
  })

  const { data: layouts = [], isLoading: layoutsLoading } = useQuery({
    queryKey: ['email-layouts'],
    queryFn: () => emailApi.getLayouts().then(r => r.data.data ?? []),
  })

  const activeTemplate = kind === 'system' ? (templates?.find(t => t.key === selected) ?? null) : null
  const activeLayout = kind === 'custom' ? (layouts.find(l => l.id === selected) ?? null) : null

  useEffect(() => {
    if (kind === 'system' && activeTemplate) {
      setSubject(activeTemplate.subject)
      setHtmlBody(activeTemplate.htmlBody)
      setIsDirty(false)
      setTab('edit')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, selected, templates])

  useEffect(() => {
    if (kind === 'custom' && activeLayout) {
      setLayoutName(activeLayout.name)
      setLayoutHtml(activeLayout.html)
      setLayoutIsDefault(activeLayout.isDefault)
      setLayoutDirty(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, selected, layouts])

  const selectSystem = (key: string) => { setKind('system'); setSelected(key) }
  const selectCustom = (id: string) => { setKind('custom'); setSelected(id) }
  const startNewLayout = () => {
    setKind('custom')
    setSelected(null)
    setLayoutName('New Template')
    setLayoutHtml(BLANK_LAYOUT_HTML)
    setLayoutIsDefault(false)
    setLayoutDirty(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => emailTemplatesApi.save(selected!, { subject, htmlBody }),
    onSuccess: () => {
      toast.success('Template saved')
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      setIsDirty(false)
    },
    onError: () => toast.error('Failed to save template'),
  })

  const resetMutation = useMutation({
    mutationFn: () => emailTemplatesApi.reset(selected!),
    onSuccess: () => {
      toast.success('Template reset to default')
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
    },
    onError: () => toast.error('Failed to reset template'),
  })

  const previewMutation = useMutation({
    mutationFn: () => emailTemplatesApi.sendPreview(selected!, previewEmail),
    onSuccess: () => toast.success(`Preview sent to ${previewEmail}`),
    onError: () => toast.error('Failed to send preview — check email settings'),
  })

  const saveLayoutMutation = useMutation({
    mutationFn: () => emailApi.saveLayout({
      id: selected ?? undefined,
      name: layoutName,
      html: layoutHtml,
      isDefault: layoutIsDefault,
    }),
    onSuccess: (res) => {
      toast.success('Template saved')
      queryClient.invalidateQueries({ queryKey: ['email-layouts'] })
      setLayoutDirty(false)
      if (res.data.data) setSelected(res.data.data.id)
    },
    onError: () => toast.error('Failed to save template'),
  })

  const deleteLayoutMutation = useMutation({
    mutationFn: (id: string) => emailApi.deleteLayout(id),
    onSuccess: () => {
      toast.success('Template deleted')
      queryClient.invalidateQueries({ queryKey: ['email-layouts'] })
      setKind(null)
      setSelected(null)
    },
    onError: () => toast.error('Failed to delete template'),
  })

  const handleChange = (field: 'subject' | 'htmlBody', value: string) => {
    if (field === 'subject') setSubject(value)
    else setHtmlBody(value)
    setIsDirty(true)
  }

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row" style={{ height: 'calc(100vh - 64px)' }}>

      {/* Sidebar — template list */}
      <div className="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white overflow-y-auto">
        <div className="px-4 py-4 border-b border-gray-100">
          <h1 className="text-lg font-semibold text-gray-900">Email Templates</h1>
          <p className="text-xs text-gray-400 mt-0.5">Automated emails &amp; custom designs</p>
        </div>

        <div className="px-4 pt-4 pb-1">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Automated Booking Emails</p>
        </div>
        {isLoading ? (
          <div className="px-4 pb-3 text-sm text-gray-400">Loading...</div>
        ) : (
          <nav className="px-2 pb-2 space-y-1">
            {templates?.map(t => {
              const meta = TEMPLATE_LABELS[t.key]
              return (
                <button
                  key={t.key}
                  onClick={() => selectSystem(t.key)}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                    kind === 'system' && selected === t.key
                      ? 'bg-sacred-100 text-sacred-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-base mt-0.5">{meta?.icon ?? '✉️'}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">{t.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {meta?.audience === 'Admin' ? 'To admin' : 'To customer'}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>
        )}

        <div className="px-4 pt-3 pb-1 flex items-center justify-between border-t border-gray-100">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Custom Templates</p>
          <button
            onClick={startNewLayout}
            className="inline-flex items-center gap-1 text-xs text-sacred-700 hover:text-sacred-900 font-medium"
          >
            <Plus size={13} /> New
          </button>
        </div>
        {layoutsLoading ? (
          <div className="px-4 pb-3 text-sm text-gray-400">Loading...</div>
        ) : layouts.length === 0 ? (
          <div className="px-4 pb-3 text-xs text-gray-400">No custom templates yet — click New to create one.</div>
        ) : (
          <nav className="px-2 pb-3 space-y-1">
            {layouts.map(l => (
              <button
                key={l.id}
                onClick={() => selectCustom(l.id)}
                className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                  kind === 'custom' && selected === l.id
                    ? 'bg-sacred-100 text-sacred-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">🎨</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">{l.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{l.isDefault ? 'Default for new emails' : 'Custom design'}</p>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Editor panel */}
      <div className="flex-1 min-w-0 flex flex-col bg-gray-50 overflow-hidden">
        {kind === 'system' && activeTemplate ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{activeTemplate.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{activeTemplate.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => { if (confirm('Reset to default template?')) resetMutation.mutate() }}
                  disabled={resetMutation.isPending}
                  className="px-3 py-1.5 text-xs text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Reset to default
                </button>
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !isDirty}
                  className="px-4 py-1.5 text-xs bg-sacred-800 text-white rounded-lg hover:bg-sacred-900 transition-colors disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving...' : isDirty ? 'Save changes' : 'Saved'}
                </button>
              </div>
            </div>

            {/* Tab bar */}
            <div className="bg-white border-b border-gray-200 px-6 flex gap-4">
              {(['edit', 'preview'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    tab === t
                      ? 'border-sacred-700 text-sacred-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t === 'edit' ? 'Edit' : 'Preview'}
                </button>
              ))}
            </div>

            {tab === 'edit' ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">

                {/* Variables chip list */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Available variables</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTemplate.variables.map(v => (
                      <code
                        key={v}
                        className="px-2 py-0.5 bg-sacred-100 text-sacred-800 text-xs rounded font-mono cursor-pointer select-all"
                        title="Click to copy"
                        onClick={() => { navigator.clipboard.writeText(`{{${v}}}`); toast.success(`Copied {{${v}}}`) }}
                      >
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Subject line</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => handleChange('subject', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
                  />
                </div>

                {/* HTML body */}
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">HTML body</label>
                  <textarea
                    value={htmlBody}
                    onChange={e => handleChange('htmlBody', e.target.value)}
                    rows={28}
                    spellCheck={false}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-sacred-500 leading-relaxed"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Live HTML preview */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500">Rendered preview (sample data)</p>
                    <p className="text-xs text-gray-400 font-mono">{subject}</p>
                  </div>
                  <iframe
                    srcDoc={htmlBody
                      .replace(/\{\{customerName\}\}/g, 'Jane Smith')
                      .replace(/\{\{serviceName\}\}/g, '60-Minute Sound Healing Session')
                      .replace(/\{\{bookingType\}\}/g, 'Sound Healing Class')
                      .replace(/\{\{amount\}\}/g, '$120.00')
                      .replace(/\{\{currency\}\}/g, 'USD')
                      .replace(/\{\{brandName\}\}/g, 'Sacred Vibes Healing & Wellness')
                      .replace(/\{\{bookingId\}\}/g, 'A1B2C3D4')
                      .replace(/\{\{adminNotes\}\}/g, 'Please arrive 10 minutes early. Wear comfortable clothing.')
                      .replace(/\{\{cancellationReason\}\}/g, 'Schedule conflict — please rebook at your convenience.')
                      .replace(/\{\{oldServiceName\}\}/g, '60-Minute Swedish Massage')
                      .replace(/\{\{newServiceName\}\}/g, '60-Minute Sound Healing Session')
                      .replace(/\{\{customerEmail\}\}/g, 'jane@example.com')
                      .replace(/\{\{requestedDate\}\}/g, 'Friday, August 28 at 2:00 PM')
                      .replace(/\{\{previousRequestedDate\}\}/g, 'Wednesday, August 26 at 10:00 AM')
                      .replace(/\{\{checkoutUrl\}\}/g, 'https://sandbox.square.link/example')
                    }
                    className="w-full"
                    style={{ height: '600px', border: 'none' }}
                    title="Email preview"
                    sandbox="allow-same-origin"
                  />
                </div>

                {/* Send test email */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Send test email</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={previewEmail}
                      onChange={e => setPreviewEmail(e.target.value)}
                      placeholder="recipient@example.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
                    />
                    <button
                      onClick={() => previewMutation.mutate()}
                      disabled={previewMutation.isPending || !previewEmail}
                      className="px-4 py-2 text-sm bg-sacred-800 text-white rounded-lg hover:bg-sacred-900 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {previewMutation.isPending ? 'Sending...' : 'Send test'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Uses sample data. Requires email settings to be configured.</p>
                </div>
              </div>
            )}
          </>
        ) : kind === 'custom' ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <input
                  value={layoutName}
                  onChange={e => { setLayoutName(e.target.value); setLayoutDirty(true) }}
                  placeholder="Template name"
                  className="text-base font-semibold text-gray-900 bg-transparent border-0 border-b border-transparent hover:border-gray-200 focus:border-sacred-500 focus:outline-none px-0 py-0.5 w-full max-w-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Custom template — choose it from the template dropdown when composing an email.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selected && (
                  <button
                    onClick={() => { if (confirm('Delete this template?')) deleteLayoutMutation.mutate(selected) }}
                    disabled={deleteLayoutMutation.isPending}
                    className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => saveLayoutMutation.mutate()}
                  disabled={saveLayoutMutation.isPending || !layoutName.trim() || !layoutHtml.trim()}
                  className="px-4 py-1.5 text-xs bg-sacred-800 text-white rounded-lg hover:bg-sacred-900 transition-colors disabled:opacity-50"
                >
                  {saveLayoutMutation.isPending ? 'Saving...' : layoutDirty ? 'Save changes' : 'Saved'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={layoutIsDefault}
                  onChange={e => { setLayoutIsDefault(e.target.checked); setLayoutDirty(true) }}
                  className="rounded border-gray-300 text-sacred-700 focus:ring-sacred-500"
                />
                Use by default when composing a new email
              </label>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Template HTML</label>
                <textarea
                  value={layoutHtml}
                  onChange={e => { setLayoutHtml(e.target.value); setLayoutDirty(true) }}
                  rows={22}
                  spellCheck={false}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-sacred-500 leading-relaxed"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Include <code className="px-1 bg-gray-100 rounded">{'{{content}}'}</code> where the composed message should be inserted.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-500">Preview</p>
                </div>
                <iframe
                  srcDoc={layoutHtml.replace(/\{\{content\}\}/i, '<p style="color:#999;font-family:sans-serif;">(your message goes here)</p>')}
                  className="w-full"
                  style={{ height: '500px', border: 'none' }}
                  title="Template preview"
                  sandbox=""
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a template to edit
          </div>
        )}
      </div>
    </div>
  )
}
