'use client'

import { useState } from 'react'
import type { EmailRecipientGroup, Newsletter } from '@/types'

interface NewsletterAudienceSchedulerProps {
  newsletter: Newsletter
  groups: EmailRecipientGroup[]
  onSchedule: (recipientGroupId: string, scheduledAtUtcIso: string) => void
  onSendNow: (recipientGroupId: string) => void
  onCancel: () => void
  onSendTest: (testEmail: string) => void
  isBusy?: boolean
}

function toLocalDateTimeInputValue(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function NewsletterAudienceScheduler({
  newsletter, groups, onSchedule, onSendNow, onCancel, onSendTest, isBusy,
}: NewsletterAudienceSchedulerProps) {
  const [groupId, setGroupId] = useState(newsletter.recipientGroupId || '')
  const [localDateTime, setLocalDateTime] = useState(
    newsletter.scheduledAt
      ? toLocalDateTimeInputValue(new Date(newsletter.scheduledAt))
      : toLocalDateTimeInputValue(new Date(Date.now() + 60 * 60 * 1000))
  )
  const [testEmail, setTestEmail] = useState('')

  const selectedGroup = groups.find(g => g.id === groupId)
  const isLocked = newsletter.status === 'Sending' || newsletter.status === 'Sent'
    || newsletter.status === 'SentWithErrors'

  const handleSchedule = () => {
    if (!groupId) return
    const iso = new Date(localDateTime).toISOString()
    onSchedule(groupId, iso)
  }

  return (
    <div className="space-y-4 bg-white border border-sacred-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-sacred-900">Who & When</h3>

      {isLocked ? (
        <div className="text-sm text-sacred-600 space-y-1">
          <p>Sent to <strong>{newsletter.recipientGroupLabel || 'recipients'}</strong> ({newsletter.recipientCount} recipients).</p>
          <p>{newsletter.sentCount} sent{newsletter.failedCount > 0 && `, ${newsletter.failedCount} failed`}.</p>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-xs font-medium text-sacred-700 mb-1.5">Send To</label>
            <select
              value={groupId}
              onChange={e => setGroupId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
            >
              <option value="">Choose a group…</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.count})</option>
              ))}
            </select>
            {selectedGroup && (
              <p className="text-xs text-sacred-400 mt-1">This will go to {selectedGroup.count} people.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-sacred-700 mb-1.5">Send Date & Time</label>
            <input
              type="datetime-local"
              value={localDateTime}
              onChange={e => setLocalDateTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={isBusy || !groupId}
              onClick={handleSchedule}
              className="px-4 py-2 bg-yoga-600 text-white text-sm font-medium rounded-lg hover:bg-yoga-700 disabled:opacity-50"
            >
              {newsletter.status === 'Scheduled' ? 'Update Schedule' : 'Schedule'}
            </button>
            {newsletter.status === 'Scheduled' && (
              <button
                type="button"
                disabled={isBusy}
                onClick={onCancel}
                className="px-4 py-2 border border-sacred-200 text-sacred-700 text-sm rounded-lg hover:bg-sacred-50 disabled:opacity-50"
              >
                Cancel Schedule
              </button>
            )}
            <button
              type="button"
              disabled={isBusy || !groupId}
              onClick={() => {
                if (window.confirm(`Send this newsletter to ${selectedGroup?.name ?? 'this group'} right now?`)) {
                  onSendNow(groupId)
                }
              }}
              className="px-4 py-2 border border-sacred-200 text-sacred-700 text-sm rounded-lg hover:bg-sacred-50 disabled:opacity-50"
            >
              Send Now
            </button>
          </div>
        </>
      )}

      <div className="border-t border-sacred-100 pt-4">
        <label className="block text-xs font-medium text-sacred-700 mb-1.5">Send Yourself a Test</label>
        <div className="flex gap-2">
          <input
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 px-3 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
          />
          <button
            type="button"
            disabled={isBusy || !testEmail.trim()}
            onClick={() => onSendTest(testEmail.trim())}
            className="px-4 py-2 border border-sacred-200 text-sacred-700 text-sm rounded-lg hover:bg-sacred-50 disabled:opacity-50"
          >
            Send Test
          </button>
        </div>
        <p className="text-xs text-sacred-400 mt-1">A test copy won&apos;t include a real unsubscribe link.</p>
      </div>
    </div>
  )
}
