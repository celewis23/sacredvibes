'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import type { AxiosError } from 'axios'
import { subscribersApi } from '@/lib/api'
import Button from '@/components/ui/button'
import type { ConsentStatus, Subscriber } from '@/types'

interface Props {
  subscriber: Subscriber
  onClose: () => void
}

function getErrorMessage(err: unknown, fallback: string) {
  const axiosError = err as AxiosError<{ errors?: string[]; message?: string }>
  return axiosError.response?.data?.errors?.[0] ?? axiosError.response?.data?.message ?? fallback
}

export default function SubscriberEditModal({ subscriber, onClose }: Props) {
  const qc = useQueryClient()
  const [firstName, setFirstName] = useState(subscriber.firstName ?? '')
  const [lastName, setLastName] = useState(subscriber.lastName ?? '')
  const [phone, setPhone] = useState(subscriber.phone ?? '')
  const [isSubscribed, setIsSubscribed] = useState(subscriber.isSubscribed)
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>(subscriber.consentStatus)
  const [notes, setNotes] = useState('')

  const saveMutation = useMutation({
    mutationFn: () => subscribersApi.updateSubscriber(subscriber.id, {
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
      isSubscribed,
      consentStatus,
      notes: notes.trim() || undefined,
      tagIds: subscriber.tags.map(t => t.id),
    }),
    onSuccess: () => {
      toast.success('Subscriber updated')
      qc.invalidateQueries({ queryKey: ['subscribers'] })
      onClose()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Could not update subscriber')),
  })

  const deleteMutation = useMutation({
    mutationFn: () => subscribersApi.deleteSubscriber(subscriber.id),
    onSuccess: () => {
      toast.success('Subscriber deleted')
      qc.invalidateQueries({ queryKey: ['subscribers'] })
      onClose()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Could not delete subscriber')),
  })

  const handleDelete = () => {
    if (!window.confirm(`Delete ${subscriber.email}? This can't be undone.`)) return
    deleteMutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl text-sacred-900">Edit Subscriber</h2>
          <button onClick={onClose} className="text-sacred-400 hover:text-sacred-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-sacred-600 mb-1">Email</label>
            <input
              value={subscriber.email}
              disabled
              className="w-full px-3 py-2 border border-sacred-200 rounded-lg text-sm bg-sacred-50 text-sacred-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-sacred-600 mb-1">First Name</label>
              <input
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-sacred-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-sacred-600 mb-1">Last Name</label>
              <input
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-sacred-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-sacred-600 mb-1">Phone</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-sacred-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-sacred-600 mb-1">Status</label>
              <select
                value={isSubscribed ? 'subscribed' : 'unsubscribed'}
                onChange={e => setIsSubscribed(e.target.value === 'subscribed')}
                className="w-full px-3 py-2 border border-sacred-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
              >
                <option value="subscribed">Subscribed</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-sacred-600 mb-1">Consent</label>
              <select
                value={consentStatus}
                onChange={e => setConsentStatus(e.target.value as ConsentStatus)}
                className="w-full px-3 py-2 border border-sacred-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
              >
                <option value="Unknown">Unknown</option>
                <option value="Subscribed">Subscribed</option>
                <option value="Unsubscribed">Unsubscribed</option>
                <option value="Bounced">Bounced</option>
                <option value="Complained">Complained</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-sacred-600 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-sacred-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-sacred-100">
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={deleteMutation.isPending}
          >
            Delete Subscriber
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
