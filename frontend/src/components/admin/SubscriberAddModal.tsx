'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import type { AxiosError } from 'axios'
import { subscribersApi } from '@/lib/api'
import Button from '@/components/ui/button'

interface Props {
  onClose: () => void
}

function getErrorMessage(err: unknown, fallback: string) {
  const axiosError = err as AxiosError<{ errors?: string[]; message?: string }>
  return axiosError.response?.data?.errors?.[0] ?? axiosError.response?.data?.message ?? fallback
}

export default function SubscriberAddModal({ onClose }: Props) {
  const qc = useQueryClient()
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  const createMutation = useMutation({
    mutationFn: () => subscribersApi.createSubscriber({
      email: email.trim(),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
      isSubscribed: true,
      consentStatus: 'Subscribed',
      notes: notes.trim() || undefined,
    }),
    onSuccess: () => {
      toast.success('Subscriber added')
      qc.invalidateQueries({ queryKey: ['subscribers'] })
      onClose()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Could not add subscriber')),
  })

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl text-sacred-900">Add Subscriber</h2>
          <button onClick={onClose} className="text-sacred-400 hover:text-sacred-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-sacred-600 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoFocus
              className="w-full px-3 py-2 border border-sacred-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
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

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-sacred-100">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={() => createMutation.mutate()}
            isLoading={createMutation.isPending}
            disabled={!isValid}
          >
            Add Subscriber
          </Button>
        </div>
      </div>
    </div>
  )
}
