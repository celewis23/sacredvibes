'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Archive, ChevronLeft, ChevronRight, Flame, Inbox, Mail, MailOpen,
  Menu, PenLine, RefreshCw, Search, Send, Settings, SquarePen, Trash2, X
} from 'lucide-react'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import { emailApi } from '@/lib/api'
import type { EmailContact, EmailFolder, EmailMailboxSettings, EmailMessage, EmailMessageSummary } from '@/types'

type PanelMode = 'message' | 'compose' | 'settings'

const DEFAULT_SETTINGS: EmailMailboxSettings = {
  isEnabled: false,
  emailAddress: 'info@sacredvibesyoga.com',
  fromName: 'Sacred Vibes Healing & Wellness',
  imapHost: '',
  imapPort: 993,
  imapUseSsl: true,
  smtpHost: '',
  smtpPort: 465,
  smtpUseSsl: true,
  username: 'info@sacredvibesyoga.com',
  hasPassword: false,
}

function formatAddress(address?: { name?: string; address?: string }) {
  if (!address) return ''
  return address.name ? `${address.name} <${address.address}>` : address.address ?? ''
}

function formatDate(value?: string) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function splitAddresses(value: string) {
  return value
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}

function uniqueEmails(values: string[]) {
  return Array.from(new Set(values.map(v => v.trim().toLowerCase()).filter(Boolean)))
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ errors?: string[]; message?: string }>
  return axiosError.response?.data?.errors?.[0] ?? axiosError.response?.data?.message ?? fallback
}

function FolderButton({
  folder,
  active,
  collapsed,
  onClick,
}: {
  folder: EmailFolder
  active: boolean
  collapsed: boolean
  onClick: () => void
}) {
  const name = folder.name.toLowerCase()
  const Icon = name.includes('draft') ? SquarePen
    : name.includes('sent') ? Send
      : name.includes('junk') || name.includes('spam') ? Flame
        : name.includes('trash') || name.includes('deleted') ? Trash2
          : name.includes('archive') ? Archive
            : Inbox

  return (
    <button
      onClick={onClick}
      title={folder.name}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
        active ? 'bg-sacred-800 text-white' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon size={15} className="shrink-0" />
      {!collapsed && <span className="truncate">{folder.name}</span>}
      {typeof folder.unreadCount === 'number' && folder.unreadCount > 0 && (
        <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${
          active ? 'bg-white/20 text-white' : 'bg-sacred-100 text-sacred-700'
        }`}>
          {folder.unreadCount}
        </span>
      )}
    </button>
  )
}

function MessageRow({
  message,
  active,
  onClick,
}: {
  message: EmailMessageSummary
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
        active ? 'bg-sacred-50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${message.isRead ? 'bg-transparent' : 'bg-sacred-700'}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`truncate text-sm ${message.isRead ? 'text-gray-700' : 'font-semibold text-gray-950'}`}>
              {formatAddress(message.from) || '(unknown sender)'}
            </p>
            {message.hasAttachments && <Archive size={13} className="text-gray-400 shrink-0" />}
          </div>
          <p className={`truncate text-sm mt-0.5 ${message.isRead ? 'text-gray-600' : 'font-medium text-gray-900'}`}>
            {message.subject || '(no subject)'}
          </p>
          <p className="truncate text-xs text-gray-400 mt-1">{message.preview}</p>
        </div>
        <span className="text-[11px] text-gray-400 shrink-0">{message.date ? new Date(message.date).toLocaleDateString() : ''}</span>
      </div>
    </button>
  )
}

function SettingsPanel({
  settings,
  onClose,
}: {
  settings?: EmailMailboxSettings
  onClose?: () => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ ...(settings ?? DEFAULT_SETTINGS), password: '' })
  const [testResult, setTestResult] = useState<string | null>(settings?.lastSyncResult ?? null)

  useEffect(() => {
    setForm({ ...(settings ?? DEFAULT_SETTINGS), password: '' })
    setTestResult(settings?.lastSyncResult ?? null)
  }, [settings])

  const saveMutation = useMutation({
    mutationFn: () => emailApi.saveSettings(form),
    onSuccess: () => {
      toast.success('Email settings saved')
      queryClient.invalidateQueries({ queryKey: ['email-settings'] })
      queryClient.invalidateQueries({ queryKey: ['email-folders'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not save email settings')),
  })

  const testMutation = useMutation({
    mutationFn: () => emailApi.testConnection(),
    onSuccess: (res) => {
      const message = res.data.data?.message ?? 'Mailbox connection succeeded'
      setTestResult(message)
      toast.success(message)
      queryClient.invalidateQueries({ queryKey: ['email-settings'] })
      queryClient.invalidateQueries({ queryKey: ['email-folders'] })
    },
    onError: (err) => {
      const message = getApiErrorMessage(err, 'Mailbox connection failed')
      setTestResult(message)
      toast.error(message)
      queryClient.invalidateQueries({ queryKey: ['email-settings'] })
    },
  })

  const set = (key: keyof typeof form, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-3">
        <Settings size={18} className="text-sacred-700" />
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900">Mailbox Settings</h2>
          <p className="text-xs text-gray-500">Connect the cPanel mailbox for info@sacredvibesyoga.com</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.isEnabled}
            onChange={e => set('isEnabled', e.target.checked)}
            className="rounded border-gray-300 text-sacred-700 focus:ring-sacred-500"
          />
          <span className="text-sm font-medium text-gray-800">Enable admin email inbox</span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
            <input value={form.emailAddress} onChange={e => set('emailAddress', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From Name</label>
            <input value={form.fromName} onChange={e => set('fromName', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500" />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Incoming Mail (IMAP)</h3>
          <div className="grid gap-4 sm:grid-cols-[1fr_110px_100px]">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">IMAP Host</label>
              <input placeholder="mail.sacredvibesyoga.com" value={form.imapHost} onChange={e => set('imapHost', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Port</label>
              <input type="number" value={form.imapPort} onChange={e => set('imapPort', Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500" />
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.imapUseSsl} onChange={e => set('imapUseSsl', e.target.checked)} className="rounded border-gray-300 text-sacred-700 focus:ring-sacred-500" />
              SSL
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Outgoing Mail (SMTP)</h3>
          <div className="grid gap-4 sm:grid-cols-[1fr_110px_100px]">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Host</label>
              <input placeholder="mail.sacredvibesyoga.com" value={form.smtpHost} onChange={e => set('smtpHost', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Port</label>
              <input type="number" value={form.smtpPort} onChange={e => set('smtpPort', Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500" />
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.smtpUseSsl} onChange={e => set('smtpUseSsl', e.target.checked)} className="rounded border-gray-300 text-sacred-700 focus:ring-sacred-500" />
              SSL
            </label>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
            <input value={form.username} onChange={e => set('username', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mailbox Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder={settings?.hasPassword ? 'Saved; leave blank to keep' : 'Required'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
            />
          </div>
        </div>

        {testResult && (
          <p className={`text-xs rounded-lg p-3 ${
            testResult.toLowerCase().includes('failed')
              ? 'bg-red-50 text-red-700 border border-red-100'
              : 'bg-gray-50 text-gray-500'
          }`}>
            {testResult}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="px-4 py-2 bg-sacred-800 text-white text-sm rounded-lg hover:bg-sacred-900 disabled:opacity-50">
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
          <button onClick={() => testMutation.mutate()} disabled={testMutation.isPending || !settings?.hasPassword} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50">
            {testMutation.isPending ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ComposePanel({
  replyTo,
  settings,
  onClose,
}: {
  replyTo?: EmailMessage
  settings?: EmailMailboxSettings
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [to, setTo] = useState<string[]>(replyTo?.from?.address ? [replyTo.from.address] : [])
  const [toInput, setToInput] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject.replace(/^Re:\s*/i, '')}` : '')
  const [body, setBody] = useState('')
  const [contactSearch, setContactSearch] = useState('')
  const [groupName, setGroupName] = useState('')

  const { data: contacts = [] } = useQuery({
    queryKey: ['email-contacts', contactSearch],
    queryFn: () => emailApi.searchContacts({ search: contactSearch || undefined, limit: 12 }).then(r => r.data.data ?? []),
  })

  const { data: groups = [] } = useQuery({
    queryKey: ['email-recipient-groups'],
    queryFn: () => emailApi.getRecipientGroups().then(r => r.data.data ?? []),
  })

  const sendMutation = useMutation({
    mutationFn: () => emailApi.send({
      to,
      cc: splitAddresses(cc),
      bcc: splitAddresses(bcc),
      subject,
      body: body.replace(/\n/g, '<br />'),
      isHtml: true,
      replyToMessageId: replyTo?.id,
      replyToFolderId: replyTo?.folderId,
    }),
    onSuccess: () => {
      toast.success('Email sent')
      queryClient.invalidateQueries({ queryKey: ['email-messages'] })
      onClose()
    },
    onError: () => toast.error('Could not send email'),
  })

  const addRecipient = (email: string) => {
    setTo(prev => uniqueEmails([...prev, email]))
    setToInput('')
    setContactSearch('')
  }

  const addTypedRecipients = () => {
    const typed = splitAddresses(toInput)
    if (typed.length === 0) return
    setTo(prev => uniqueEmails([...prev, ...typed]))
    setToInput('')
    setContactSearch('')
  }

  const addGroupMutation = useMutation({
    mutationFn: (groupId: string) => emailApi.getRecipientGroupContacts(groupId).then(r => r.data.data ?? []),
    onSuccess: (recipients: EmailContact[]) => {
      setBcc(prev => uniqueEmails([...splitAddresses(prev), ...recipients.map(r => r.email)]).join(', '))
      toast.success(`Added ${recipients.length} recipients to Bcc`)
    },
    onError: () => toast.error('Could not add recipient group'),
  })

  const allRecipients = useMemo(
    () => uniqueEmails([...to, ...splitAddresses(cc), ...splitAddresses(bcc)]),
    [to, cc, bcc],
  )

  const createGroupMutation = useMutation({
    mutationFn: () => emailApi.createRecipientGroup({ name: groupName, emails: allRecipients }),
    onSuccess: (res) => {
      toast.success(`Created ${res.data.data?.name ?? 'recipient group'}`)
      setGroupName('')
      queryClient.invalidateQueries({ queryKey: ['email-recipient-groups'] })
      queryClient.invalidateQueries({ queryKey: ['email-contacts'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not create recipient group')),
  })

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="border-b border-gray-200 px-5 py-4 flex items-center gap-3">
        <PenLine size={18} className="text-sacred-700" />
        <div>
          <h2 className="font-semibold text-gray-900">{replyTo ? 'Reply' : 'New Email'}</h2>
          <p className="text-xs text-gray-500">Sending as {settings?.emailAddress ?? 'info@sacredvibesyoga.com'}</p>
        </div>
        <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-700"><X size={18} /></button>
      </div>
      <div className="p-5 space-y-3 border-b border-gray-100">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <div className="min-h-10 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus-within:ring-2 focus-within:ring-sacred-500">
            <div className="flex flex-wrap items-center gap-1.5">
              {to.map(email => (
                <span key={email} className="inline-flex items-center gap-1 rounded-full bg-sacred-100 text-sacred-800 px-2 py-1 text-xs">
                  {email}
                  <button onClick={() => setTo(prev => prev.filter(v => v !== email))} className="text-sacred-500 hover:text-sacred-900">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                value={toInput}
                onChange={e => {
                  setToInput(e.target.value)
                  setContactSearch(e.target.value)
                }}
                onBlur={addTypedRecipients}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addTypedRecipients()
                  }
                }}
                placeholder={to.length ? 'Add another recipient' : 'Start typing a name or email'}
                className="min-w-48 flex-1 px-1 py-1 focus:outline-none"
              />
            </div>
          </div>
          {toInput && contacts.length > 0 && (
            <div className="mt-1 border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
              {contacts.map(contact => (
                <button
                  key={`${contact.email}-${contact.source}`}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => addRecipient(contact.email)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between gap-3"
                >
                  <span className="min-w-0">
                    <span className="font-medium text-gray-800">{contact.name || contact.email}</span>
                    {contact.name && <span className="text-gray-400"> &lt;{contact.email}&gt;</span>}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">{contact.source}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            defaultValue=""
            onChange={e => {
              if (!e.target.value) return
              addGroupMutation.mutate(e.target.value)
              e.target.value = ''
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
          >
            <option value="">Add recipient group...</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name} ({group.count})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400">Groups are added to Bcc so recipients do not see the full list.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="New group name"
            className="min-w-56 flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
          />
          <button
            onClick={() => createGroupMutation.mutate()}
            disabled={createGroupMutation.isPending || !groupName.trim() || allRecipients.length === 0}
            className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {createGroupMutation.isPending ? 'Saving...' : 'Save Recipients as Group'}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={cc} onChange={e => setCc(e.target.value)} placeholder="Cc" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500" />
          <input value={bcc} onChange={e => setBcc(e.target.value)} placeholder="Bcc" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500" />
        </div>
        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500" />
      </div>
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message..." className="flex-1 p-5 text-sm resize-none focus:outline-none" />
      <div className="border-t border-gray-200 px-5 py-4 flex justify-end">
        <button
          onClick={() => sendMutation.mutate()}
          disabled={sendMutation.isPending || allRecipients.length === 0 || !subject.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sacred-800 text-white text-sm rounded-lg hover:bg-sacred-900 disabled:opacity-50"
        >
          <Send size={15} />
          {sendMutation.isPending ? 'Sending...' : 'Send Email'}
        </button>
      </div>
    </div>
  )
}

function MessagePanel({
  message,
  folders,
  onReply,
  onDeleted,
}: {
  message?: EmailMessage
  folders: EmailFolder[]
  onReply: () => void
  onDeleted: () => void
}) {
  const queryClient = useQueryClient()

  const markMutation = useMutation({
    mutationFn: (isRead: boolean) => emailApi.markRead(message!.id, message!.folderId, isRead),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['email-messages'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => emailApi.delete(message!.id, message!.folderId),
    onSuccess: () => {
      toast.success('Message deleted')
      queryClient.invalidateQueries({ queryKey: ['email-messages'] })
      onDeleted()
    },
    onError: () => toast.error('Could not delete message'),
  })

  const archiveFolder = folders.find(f => /archive/i.test(f.name))
  const archiveMutation = useMutation({
    mutationFn: () => emailApi.move(message!.id, message!.folderId, archiveFolder!.id),
    onSuccess: () => {
      toast.success('Message archived')
      queryClient.invalidateQueries({ queryKey: ['email-messages'] })
      onDeleted()
    },
    onError: () => toast.error('Could not archive message'),
  })

  if (!message) {
    return (
      <div className="h-full flex items-center justify-center text-center p-10 bg-white">
        <div>
          <Mail size={34} className="mx-auto text-gray-300 mb-3" />
          <p className="font-medium text-gray-700">Select an email</p>
          <p className="text-sm text-gray-400 mt-1">Choose a message from the inbox to read it here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={onReply} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sacred-800 text-white text-xs rounded-lg hover:bg-sacred-900">
            <PenLine size={13} /> Reply
          </button>
          <button onClick={() => markMutation.mutate(!message.isRead)} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50">
            {message.isRead ? <Mail size={13} /> : <MailOpen size={13} />}
            {message.isRead ? 'Unread' : 'Read'}
          </button>
          {archiveFolder && (
            <button onClick={() => archiveMutation.mutate()} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50">
              <Archive size={13} /> Archive
            </button>
          )}
          <button onClick={() => deleteMutation.mutate()} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 text-xs rounded-lg hover:bg-red-50 ml-auto">
            <Trash2 size={13} /> Delete
          </button>
        </div>
        <h2 className="text-xl font-semibold text-gray-950">{message.subject || '(no subject)'}</h2>
        <div className="mt-3 text-xs text-gray-500 space-y-1">
          <p><span className="text-gray-400">From:</span> {formatAddress(message.from)}</p>
          <p><span className="text-gray-400">To:</span> {message.to.map(formatAddress).join(', ')}</p>
          {message.cc.length > 0 && <p><span className="text-gray-400">Cc:</span> {message.cc.map(formatAddress).join(', ')}</p>}
          <p><span className="text-gray-400">Date:</span> {formatDate(message.date)}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {message.htmlBody ? (
          <iframe title="Email message" sandbox="" srcDoc={message.htmlBody} className="w-full min-h-full border-0 bg-white" />
        ) : (
          <pre className="whitespace-pre-wrap p-5 text-sm leading-relaxed text-gray-800 font-sans">{message.textBody}</pre>
        )}
        {message.attachments.length > 0 && (
          <div className="m-5 border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Attachments</p>
            <div className="space-y-2">
              {message.attachments.map((attachment, index) => (
                <div key={`${attachment.fileName}-${index}`} className="text-sm text-gray-700 flex items-center gap-2">
                  <Archive size={14} className="text-gray-400" />
                  <span>{attachment.fileName}</span>
                  <span className="text-xs text-gray-400">{attachment.contentType}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminEmailPage() {
  const queryClient = useQueryClient()
  const [folderId, setFolderId] = useState<string | undefined>('INBOX')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [mode, setMode] = useState<PanelMode>('message')
  const [replyTo, setReplyTo] = useState<EmailMessage | undefined>()
  const [folderRailCollapsed, setFolderRailCollapsed] = useState(false)

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['email-settings'],
    queryFn: () => emailApi.getSettings().then(r => r.data.data ?? DEFAULT_SETTINGS),
  })

  const enabled = !!settings?.isEnabled && !!settings.hasPassword

  const { data: folders = [] } = useQuery({
    queryKey: ['email-folders'],
    queryFn: () => emailApi.getFolders().then(r => r.data.data ?? []),
    enabled,
  })

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['email-messages', folderId, page, search],
    queryFn: () => emailApi.getMessages({ folderId, page, pageSize: 25, search: search || undefined }).then(r => r.data.data),
    enabled,
  })

  const { data: selectedMessage, isLoading: messageLoading } = useQuery({
    queryKey: ['email-message', selectedMessageId, folderId],
    queryFn: () => emailApi.getMessage(selectedMessageId!, folderId).then(r => r.data.data),
    enabled: enabled && !!selectedMessageId && mode === 'message',
  })

  const activeFolderName = useMemo(() => folders.find(f => f.id === folderId)?.name ?? 'Inbox', [folders, folderId])

  useEffect(() => {
    if (folders.length && !folders.some(f => f.id === folderId)) {
      setFolderId(folders[0].id)
    }
  }, [folders, folderId])

  if (settingsLoading) {
    return <div className="p-8 text-sm text-gray-400">Loading email settings...</div>
  }

  if (!settings?.isEnabled || !settings.hasPassword) {
    return (
      <div className="p-6 lg:p-8 h-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Email Inbox</h1>
          <p className="text-sm text-gray-500 mt-1">Connect your cPanel mailbox to manage info@sacredvibesyoga.com from admin.</p>
        </div>
        <div className="max-w-4xl h-[calc(100vh-11rem)] border border-gray-200 rounded-xl overflow-hidden">
          <SettingsPanel settings={settings} />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Email Inbox</h1>
          <p className="text-sm text-gray-500 mt-0.5">{settings.emailAddress}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['email-messages'] })}
            className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => { setReplyTo(undefined); setMode('compose') }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sacred-800 text-white text-sm rounded-lg hover:bg-sacred-900"
          >
            <PenLine size={15} /> Compose
          </button>
          <button
            onClick={() => setMode('settings')}
            className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div className={`flex-1 min-h-0 grid ${folderRailCollapsed ? 'grid-cols-[64px_minmax(320px,430px)_1fr]' : 'grid-cols-[220px_minmax(320px,430px)_1fr]'}`}>
        <aside className="bg-white border-r border-gray-200 p-3 overflow-y-auto">
          <button
            onClick={() => setFolderRailCollapsed(v => !v)}
            className="mb-3 w-full flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
            title={folderRailCollapsed ? 'Expand folders' : 'Collapse folders'}
          >
            <Menu size={15} />
          </button>
          <div className="space-y-1">
            {folders.map(folder => (
              <FolderButton
                key={folder.id}
                folder={folder}
                active={folder.id === folderId}
                collapsed={folderRailCollapsed}
                onClick={() => {
                  setFolderId(folder.id)
                  setPage(1)
                  setSelectedMessageId(null)
                  setMode('message')
                }}
              />
            ))}
          </div>
        </aside>

        <section className="bg-white border-r border-gray-200 flex flex-col min-w-0">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-semibold text-gray-900">{activeFolderName}</h2>
              {messages && <span className="text-xs text-gray-400">{messages.totalCount} messages</span>}
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search sender or subject"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {messagesLoading ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading messages...</div>
            ) : (messages?.items.length ?? 0) === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No messages found.</div>
            ) : (
              messages?.items.map(message => (
                <MessageRow
                  key={message.id}
                  message={message}
                  active={selectedMessageId === message.id}
                  onClick={() => {
                    setSelectedMessageId(message.id)
                    setMode('message')
                  }}
                />
              ))
            )}
          </div>
          {messages && messages.totalPages > 1 && (
            <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between text-sm text-gray-500">
              <span>Page {messages.page} of {messages.totalPages}</span>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="p-1.5 border border-gray-300 rounded disabled:opacity-40"><ChevronLeft size={15} /></button>
                <button disabled={page >= messages.totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 border border-gray-300 rounded disabled:opacity-40"><ChevronRight size={15} /></button>
              </div>
            </div>
          )}
        </section>

        <section className="min-w-0">
          {mode === 'settings' ? (
            <SettingsPanel settings={settings} onClose={() => setMode('message')} />
          ) : mode === 'compose' ? (
            <ComposePanel settings={settings} replyTo={replyTo} onClose={() => setMode('message')} />
          ) : messageLoading ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">Loading message...</div>
          ) : (
            <MessagePanel
              message={selectedMessage}
              folders={folders}
              onReply={() => {
                setReplyTo(selectedMessage)
                setMode('compose')
              }}
              onDeleted={() => setSelectedMessageId(null)}
            />
          )}
        </section>
      </div>
    </div>
  )
}
