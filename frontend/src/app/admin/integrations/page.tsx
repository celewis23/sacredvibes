'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { subscribersApi } from '@/lib/api'
import ImportModal from '@/components/admin/ImportModal'

type ImportSource = 'square' | 'stripe' | 'csv'

interface IntegrationCardProps {
  title: string
  description: string
  badge?: string
  badgeColor?: string
  actionLabel: string
  onAction: () => void
  isLoading?: boolean
  children?: React.ReactNode
}

function IntegrationCard({
  title, description, badge, badgeColor = 'bg-green-100 text-green-700',
  actionLabel, onAction, isLoading, children,
}: IntegrationCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {badge && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>{badge}</span>
            )}
          </div>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {children && <div className="mt-4 mb-4">{children}</div>}
      <button
        onClick={onAction}
        disabled={isLoading}
        className="px-4 py-2 bg-sacred-800 text-white text-sm rounded-lg hover:bg-sacred-900 disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'Running...' : actionLabel}
      </button>
    </div>
  )
}

export default function AdminIntegrationsPage() {
  const queryClient = useQueryClient()
  const [importModal, setImportModal] = useState<ImportSource | null>(null)

  const squareMutation = useMutation({
    mutationFn: () => subscribersApi.importFromSquare(),
    onSuccess: (res) => {
      const d = (res as { data?: { data?: { inserted?: number; updated?: number; skipped?: number } } }).data?.data
      toast.success(`Square import complete: ${d?.inserted ?? 0} added, ${d?.updated ?? 0} updated`)
      queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] })
    },
    onError: () => toast.error('Square import failed'),
  })

  const stripeMutation = useMutation({
    mutationFn: () => subscribersApi.importFromStripe(),
    onSuccess: (res) => {
      const d = (res as { data?: { data?: { inserted?: number; updated?: number; skipped?: number } } }).data?.data
      toast.success(`Stripe import complete: ${d?.inserted ?? 0} added, ${d?.updated ?? 0} updated`)
      queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] })
    },
    onError: () => toast.error('Stripe import failed'),
  })

  return (
    <div>
      {importModal === 'csv' && (
        <ImportModal
          source="csv"
          onClose={() => setImportModal(null)}
          onSuccess={() => {
            setImportModal(null)
            queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] })
          }}
        />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500 mt-1">Manage external connections and data imports</p>
      </div>

      <div className="space-y-8">
        {/* Payments section */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Payments & Customer Data</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <IntegrationCard
              title="Square"
              description="Import customers from your Square account as subscribers. Safe to run multiple times — duplicates are skipped."
              badge="Payment Processor"
              actionLabel="Import Square Customers"
              onAction={() => squareMutation.mutate()}
              isLoading={squareMutation.isPending}
            >
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 space-y-1">
                <p>Payment processing is configured via environment variables:</p>
                <code className="block text-gray-700">Square:AccessToken</code>
                <code className="block text-gray-700">Square:LocationId</code>
                <code className="block text-gray-700">Square:WebhookSignatureKey</code>
              </div>
            </IntegrationCard>

            <IntegrationCard
              title="Stripe"
              description="Import contacts from your Stripe customer list. Read-only — Sacred Vibes does not process payments through Stripe."
              badge="Import Only"
              badgeColor="bg-blue-100 text-blue-700"
              actionLabel="Import Stripe Contacts"
              onAction={() => stripeMutation.mutate()}
              isLoading={stripeMutation.isPending}
            >
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 space-y-1">
                <p>Configured via environment variable:</p>
                <code className="block text-gray-700">Stripe:ApiKey</code>
              </div>
            </IntegrationCard>
          </div>
        </div>

        {/* CSV section */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">CSV Import</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <IntegrationCard
              title="CSV File Import"
              description="Import subscribers from any CSV file — Mailchimp exports, spreadsheet lists, CRM exports. Supports preview before committing."
              badge="Flexible"
              badgeColor="bg-purple-100 text-purple-700"
              actionLabel="Upload CSV File"
              onAction={() => setImportModal('csv')}
            >
              <div className="text-xs text-gray-500 space-y-1">
                <p>Supported columns: email, first_name, last_name, phone, subscribed</p>
                <p>Max file size: 10 MB · Max rows: 50,000</p>
              </div>
            </IntegrationCard>
          </div>
        </div>

        {/* Webhook info */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Webhooks</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Square Webhook Endpoint</h3>
            <p className="text-sm text-gray-500 mb-3">
              Register this URL in the Square Developer Dashboard to receive payment events automatically.
            </p>
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
              <code className="text-sm text-gray-700 flex-1">
                https://api.sacredvibesyoga.com/api/bookings/webhooks/square
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('https://api.sacredvibesyoga.com/api/bookings/webhooks/square')
                  toast.success('Copied to clipboard')
                }}
                className="text-xs text-sacred-700 hover:text-sacred-900 border border-sacred-300 px-2.5 py-1 rounded hover:bg-sacred-50 transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <p className="font-medium mb-1">Subscribe to these events:</p>
              <ul className="list-disc list-inside space-y-0.5 text-gray-400">
                <li>payment.completed</li>
                <li>payment.updated</li>
                <li>order.completed</li>
                <li>refund.created / refund.updated</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
