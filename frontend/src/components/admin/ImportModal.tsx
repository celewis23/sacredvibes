'use client'

import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Upload, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { subscribersApi } from '@/lib/api'
import Button from '@/components/ui/button'

interface Props {
  type: 'square' | 'stripe' | 'csv'
  onClose: () => void
  onSuccess: () => void
}

interface ImportResult {
  insertedCount: number
  updatedCount: number
  skippedCount: number
  errorCount: number
  totalRows: number
  status: string
  errorSummary?: string
}

export default function ImportModal({ type, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const title = { square: 'Import from Square', stripe: 'Import from Stripe', csv: 'Import CSV' }[type]

  const importMutation = useMutation({
    mutationFn: async () => {
      if (type === 'square') {
        const res = await subscribersApi.importFromSquare()
        return res.data?.data as ImportResult
      }
      if (type === 'stripe') {
        const res = await subscribersApi.importFromStripe()
        return res.data?.data as ImportResult
      }
      if (type === 'csv' && file) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('hasHeader', 'true')
        const res = await subscribersApi.importCsv(fd)
        return res.data?.data as ImportResult
      }
      throw new Error('No file selected')
    },
    onSuccess: (data) => {
      setResult(data)
    },
    onError: (err) => {
      toast.error((err as Error).message || 'Import failed')
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-md p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl text-sacred-900">{title}</h2>
          <button onClick={onClose} className="text-sacred-400 hover:text-sacred-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        {result ? (
          /* Results screen */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
              <CheckCircle2 size={20} className="text-green-600 shrink-0" />
              <p className="text-sm text-green-800 font-medium">Import {result.status.toLowerCase()}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Inserted', value: result.insertedCount, color: 'text-green-700' },
                { label: 'Updated', value: result.updatedCount, color: 'text-yoga-700' },
                { label: 'Skipped', value: result.skippedCount, color: 'text-sacred-500' },
                { label: 'Errors', value: result.errorCount, color: 'text-red-600' },
              ].map((item) => (
                <div key={item.label} className="bg-sacred-50 rounded-xl p-3 text-center">
                  <p className={`text-2xl font-heading font-semibold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-sacred-500">{item.label}</p>
                </div>
              ))}
            </div>
            {result.errorSummary && (
              <div className="flex gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{result.errorSummary}</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button onClick={onSuccess} fullWidth>Done</Button>
            </div>
          </div>
        ) : (
          /* Import form */
          <div className="space-y-5">
            {(type === 'square' || type === 'stripe') && (
              <div className="p-4 bg-sacred-50 rounded-xl border border-sacred-100">
                <p className="text-sm text-sacred-700 leading-relaxed">
                  {type === 'square'
                    ? 'This will import all customer contacts from your Square account. Make sure your Square API key is configured in Integrations.'
                    : 'This will import all Stripe customer contacts. Make sure your Stripe API key is configured in Integrations.'}
                </p>
              </div>
            )}

            {type === 'csv' && (
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-sacred-200 rounded-xl p-8 text-center cursor-pointer hover:border-yoga-300 hover:bg-yoga-50/50 transition-colors"
                >
                  <Upload size={24} className="mx-auto mb-3 text-sacred-400" />
                  {file ? (
                    <p className="text-sm font-medium text-sacred-800">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-sacred-700">Click to select CSV file</p>
                      <p className="text-xs text-sacred-400 mt-1">Requires email column. First/last name and phone optional.</p>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} fullWidth>Cancel</Button>
              <Button
                onClick={() => importMutation.mutate()}
                isLoading={importMutation.isPending}
                disabled={type === 'csv' && !file}
                fullWidth
              >
                {importMutation.isPending ? 'Importing...' : 'Start Import'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
