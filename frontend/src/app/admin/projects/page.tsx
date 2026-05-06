'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FolderOpen, Plus, Search, Music, Image, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { projectsApi } from '@/lib/api'
import type { ProjectSummary } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (title: string, description: string) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">New Project</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Sound Bath — Full Moon Ceremony"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
              onKeyDown={e => e.key === 'Enter' && title.trim() && onCreate(title.trim(), description.trim())}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief notes about this project..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sacred-500"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          <button
            onClick={() => title.trim() && onCreate(title.trim(), description.trim())}
            disabled={!title.trim()}
            className="px-4 py-2 bg-sacred-800 text-white text-sm rounded-lg hover:bg-sacred-900 disabled:opacity-40 transition-colors"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminProjectsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-projects', page, debouncedSearch],
    queryFn: () => projectsApi.list({ page, pageSize: 20, search: debouncedSearch || undefined }).then(r => r.data.data),
  })

  const createMutation = useMutation({
    mutationFn: ({ title, description }: { title: string; description: string }) =>
      projectsApi.create({ title, description: description || undefined }),
    onSuccess: (res) => {
      const id = res.data.data?.id
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] })
      setShowCreate(false)
      if (id) router.push(`/admin/projects/${id}`)
    },
    onError: () => toast.error('Failed to create project'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] })
      toast.success('Project deleted')
    },
    onError: () => toast.error('Failed to delete project'),
  })

  const handleSearch = (val: string) => {
    setSearch(val)
    clearTimeout((window as unknown as { _projSearchTimer: ReturnType<typeof setTimeout> })._projSearchTimer)
    ;(window as unknown as { _projSearchTimer: ReturnType<typeof setTimeout> })._projSearchTimer = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 300)
  }

  const handleDelete = (p: ProjectSummary) => {
    if (confirm(`Delete "${p.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(p.id)
    }
  }

  const projects = data?.items ?? []
  const total = data?.totalCount ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="p-6 lg:p-8">
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={(title, description) => createMutation.mutate({ title, description })}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">{total} {total === 1 ? 'project' : 'projects'}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sacred-800 text-white text-sm rounded-lg hover:bg-sacred-900 transition-colors"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Search projects..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-sacred-400" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">
            {debouncedSearch ? 'No projects match your search.' : 'No projects yet.'}
          </p>
          {!debouncedSearch && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-sm text-sacred-700 underline underline-offset-2"
            >
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              onDelete={() => handleDelete(p)}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
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

function ProjectCard({
  project, onDelete, isDeleting,
}: {
  project: ProjectSummary
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-card transition-shadow group">
      <Link href={`/admin/projects/${project.id}`} className="block">
        {project.coverImageUrl ? (
          <div className="h-40 overflow-hidden bg-gray-100">
            <img
              src={project.coverImageUrl}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-sacred-100 to-yoga-100 flex items-center justify-center">
            <FolderOpen size={32} className="text-sacred-300" />
          </div>
        )}
      </Link>
      <div className="p-4">
        <Link href={`/admin/projects/${project.id}`} className="block">
          <h3 className="font-semibold text-gray-900 text-sm truncate hover:text-sacred-800 transition-colors">
            {project.title}
          </h3>
          {project.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{project.description}</p>
          )}
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Image size={12} />
            {project.imageCount}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Music size={12} />
            {project.trackCount}
          </span>
          <span className="text-xs text-gray-400 ml-auto">{formatDate(project.updatedAt)}</span>
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <Link
            href={`/admin/projects/${project.id}`}
            className="flex-1 text-center px-2.5 py-1.5 text-xs text-sacred-700 border border-sacred-300 rounded-lg hover:bg-sacred-50 transition-colors"
          >
            Open
          </Link>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete project"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
