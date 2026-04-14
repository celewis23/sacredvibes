'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { importsApi } from '@/lib/api'
import type { ImportJob } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  Completed: 'bg-green-100 text-green-700',
  Processing: 'bg-blue-100 text-blue-700',
  Pending: 'bg-yellow-100 text-yellow-600',
  Failed: 'bg-red-100 text-red-600',
}

const SOURCE_COLORS: Record<string, string> = {
  Square: 'bg-indigo-100 text-indigo-700',
  Stripe: 'bg-purple-100 text-purple-700',
  Csv: 'bg-teal-100 text-teal-700',
  Manual: 'bg-gray-100 text-gray-600',
  Api: 'bg-orange-100 text-orange-700',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  })
}

function duration(start?: string, end?: string): string {
  if (!start || !end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export default function AdminImportsPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-imports', page],
    queryFn: () => importsApi.getJobs({ page, pageSize: 20 }).then(r => r.data.data),
  })

  const jobs = data?.items ?? []
  const total = data?.totalCount ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Import History</h1>
        <p className="text-sm text-gray-500 mt-1">{total} import jobs</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-400 text-sm">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center text-gray-400 text-sm">
          No import jobs yet. Use the{' '}
          <a href="/admin/subscribers" className="text-yoga-700 hover:underline">Subscribers</a>
          {' '}or{' '}
          <a href="/admin/integrations" className="text-yoga-700 hover:underline">Integrations</a>
          {' '}page to run your first import.
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">Source</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 text-xs">Total</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 text-xs">Inserted</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 text-xs">Updated</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 text-xs">Skipped</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 text-xs">Errors</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 text-xs">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job: ImportJob) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                      <div>{formatDate(job.createdAt)}</div>
                      {job.fileName && <div className="text-gray-400 mt-0.5 truncate max-w-[180px]">{job.fileName}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SOURCE_COLORS[job.source] ?? 'bg-gray-100 text-gray-600'}`}>
                        {job.source}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[job.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 font-medium">{job.totalRows.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-green-700">{job.insertedCount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-blue-700">{job.updatedCount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{job.skippedCount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      {job.errorCount > 0 ? (
                        <span className="text-red-600 font-medium">{job.errorCount.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">{duration(job.startedAt, job.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
