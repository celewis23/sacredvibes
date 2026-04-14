'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { blogApi } from '@/lib/api'
import type { BlogPostSummary, ContentStatus } from '@/types'

const STATUS_COLORS: Record<ContentStatus, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Published: 'bg-green-100 text-green-700',
  Scheduled: 'bg-blue-100 text-blue-700',
  Archived: 'bg-yellow-100 text-yellow-700',
}

export default function AdminBlogPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContentStatus | ''>('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blog-posts', page, debouncedSearch, statusFilter],
    queryFn: () =>
      blogApi.adminGetPosts({
        page,
        pageSize: 20,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      }).then(r => r.data.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogApi.adminDeletePost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] }),
  })

  const handleSearch = (val: string) => {
    setSearch(val)
    clearTimeout((window as unknown as { _blogSearchTimer: ReturnType<typeof setTimeout> })._blogSearchTimer)
    ;(window as unknown as { _blogSearchTimer: ReturnType<typeof setTimeout> })._blogSearchTimer = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 300)
  }

  const handleDelete = (post: BlogPostSummary) => {
    if (confirm(`Delete "${post.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(post.id)
    }
  }

  const posts = data?.items ?? []
  const total = data?.totalCount ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Blog Posts</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total posts</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="px-4 py-2 bg-sacred-800 text-white text-sm rounded-lg hover:bg-sacred-900 transition-colors"
        >
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          type="search"
          placeholder="Search posts..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as ContentStatus | ''); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
        >
          <option value="">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No posts found.{' '}
            <Link href="/admin/blog/new" className="text-sacred-700 underline">
              Create the first one.
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Title</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Brand</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Author</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Published</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 max-w-xs truncate">{post.title}</div>
                    {post.categoryNames.length > 0 && (
                      <div className="text-xs text-gray-400 mt-0.5">{post.categoryNames.join(', ')}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">
                    {post.brandSlug.replace(/-/g, ' ')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[post.status]}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{post.authorName}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString()
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="px-2.5 py-1 text-xs text-sacred-700 border border-sacred-300 rounded hover:bg-sacred-50 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(post)}
                        disabled={deleteMutation.isPending}
                        className="px-2.5 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
