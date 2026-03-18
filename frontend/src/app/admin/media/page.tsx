'use client'

import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { Upload, Search, Grid3x3, List, X, Image as ImageIcon, Trash2, Copy } from 'lucide-react'
import NextImage from 'next/image'
import { assetsApi } from '@/lib/api'
import type { Asset } from '@/types'
import Button from '@/components/ui/button'
import Card from '@/components/ui/card'
import Badge from '@/components/ui/badge'

export default function MediaLibraryPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selected, setSelected] = useState<Asset | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['assets', page, search],
    queryFn: async () => {
      const res = await assetsApi.getAssets({ page, pageSize: 24, search: search || undefined })
      return res.data?.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetsApi.delete(id),
    onSuccess: () => {
      toast.success('Asset deleted')
      setSelected(null)
      qc.invalidateQueries({ queryKey: ['assets'] })
    },
    onError: () => toast.error('Delete failed'),
  })

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return
    setIsUploading(true)
    const fd = new FormData()
    acceptedFiles.forEach((f) => fd.append('files', f))
    fd.append('visibility', 'Public')
    fd.append('usage', 'General')

    try {
      await assetsApi.upload(fd)
      toast.success(`${acceptedFiles.length} file${acceptedFiles.length > 1 ? 's' : ''} uploaded`)
      qc.invalidateQueries({ queryKey: ['assets'] })
    } catch {
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [qc])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'], 'application/pdf': ['.pdf'] },
    maxSize: 25 * 1024 * 1024,
  })

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied')
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-display-sm text-sacred-900">Media Library</h1>
          <p className="text-sm text-sacred-500">{data?.totalCount ?? '—'} assets</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-yoga-100 text-yoga-700' : 'text-sacred-400 hover:text-sacred-700'}`}
          >
            <Grid3x3 size={18} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-yoga-100 text-yoga-700' : 'text-sacred-400 hover:text-sacred-700'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-yoga-400 bg-yoga-50' : 'border-sacred-200 hover:border-yoga-300 hover:bg-yoga-50/40'
        }`}
      >
        <input {...getInputProps()} />
        <Upload size={24} className="mx-auto mb-2 text-sacred-400" />
        <p className="text-sm font-medium text-sacred-700">
          {isUploading ? 'Uploading...' : isDragActive ? 'Drop files here' : 'Drag & drop or click to upload'}
        </p>
        <p className="text-xs text-sacred-400 mt-1">Images and PDFs up to 25 MB</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sacred-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search assets..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sacred-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
        />
      </div>

      <div className="flex gap-6">
        {/* Asset grid/list */}
        <div className="flex-1 min-w-0">
          {view === 'grid' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {isLoading && [...Array(12)].map((_, i) => (
                <div key={i} className="aspect-square bg-sacred-100 rounded-xl animate-pulse" />
              ))}
              {!isLoading && (data?.items ?? []).map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => setSelected(asset)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selected?.id === asset.id ? 'border-yoga-500 shadow-glow' : 'border-transparent hover:border-sacred-200'
                  }`}
                >
                  {asset.assetType === 'Image' && asset.publicUrl ? (
                    <div className="relative w-full h-full">
                      <NextImage
                        src={asset.publicUrl}
                        alt={asset.altText ?? asset.fileName}
                        fill
                        className="object-cover"
                        sizes="150px"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-sacred-100 flex items-center justify-center">
                      <ImageIcon size={24} className="text-sacred-400" />
                    </div>
                  )}
                </button>
              ))}
              {!isLoading && !data?.items?.length && (
                <div className="col-span-full py-16 text-center text-sacred-400">
                  <ImageIcon size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No assets found</p>
                </div>
              )}
            </div>
          ) : (
            <Card padding="none">
              <table className="w-full text-sm">
                <thead className="bg-sacred-50 border-b border-sacred-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-sacred-500 uppercase">File</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-sacred-500 uppercase hidden md:table-cell">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-sacred-500 uppercase hidden md:table-cell">Size</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-sacred-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sacred-50">
                  {(data?.items ?? []).map((asset) => (
                    <tr key={asset.id} className="hover:bg-sacred-50/50">
                      <td className="px-4 py-3 font-medium text-sacred-800">{asset.originalFileName}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant="neutral" size="sm">{asset.assetType}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sacred-500 hidden md:table-cell">
                        {(asset.fileSize / 1024).toFixed(0)} KB
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {asset.publicUrl && (
                            <button
                              onClick={() => copyUrl(asset.publicUrl!)}
                              className="p-1.5 text-sacred-400 hover:text-sacred-700 rounded transition-colors"
                              title="Copy URL"
                            >
                              <Copy size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => { if (confirm('Delete this asset?')) deleteMutation.mutate(asset.id) }}
                            className="p-1.5 text-sacred-400 hover:text-red-600 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-xs text-sacred-500">Page {page} of {data.totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!data.hasPreviousPage} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={!data.hasNextPage} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 shrink-0">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-sacred-800">Asset Details</p>
                <button onClick={() => setSelected(null)} className="text-sacred-400 hover:text-sacred-700">
                  <X size={16} />
                </button>
              </div>
              {selected.assetType === 'Image' && selected.publicUrl && (
                <div className="aspect-square rounded-xl overflow-hidden bg-sacred-100 mb-4 relative">
                  <NextImage src={selected.publicUrl} alt={selected.altText ?? ''} fill className="object-contain" />
                </div>
              )}
              <div className="space-y-2 text-xs text-sacred-600">
                <div><span className="font-medium text-sacred-800">File:</span> {selected.originalFileName}</div>
                <div><span className="font-medium text-sacred-800">Type:</span> {selected.contentType}</div>
                <div><span className="font-medium text-sacred-800">Size:</span> {(selected.fileSize / 1024).toFixed(1)} KB</div>
                {selected.width && <div><span className="font-medium text-sacred-800">Dimensions:</span> {selected.width} × {selected.height}px</div>}
                {selected.altText && <div><span className="font-medium text-sacred-800">Alt text:</span> {selected.altText}</div>}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {selected.publicUrl && (
                  <Button variant="secondary" size="sm" fullWidth onClick={() => copyUrl(selected.publicUrl!)}>
                    <Copy size={14} /> Copy URL
                  </Button>
                )}
                <Button variant="danger" size="sm" fullWidth
                  onClick={() => { if (confirm('Delete this asset?')) deleteMutation.mutate(selected.id) }}
                  isLoading={deleteMutation.isPending}
                >
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
