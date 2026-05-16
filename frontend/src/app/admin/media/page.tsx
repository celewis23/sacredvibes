'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { toast } from 'sonner'
import { Upload, Search, Grid3x3, List, X, Image as ImageIcon, Music, Video, FileText, Trash2, Copy, Hash, Download } from 'lucide-react'
import { assetsApi } from '@/lib/api'
import type { Asset } from '@/types'
import Button from '@/components/ui/button'
import Card from '@/components/ui/card'
import Badge from '@/components/ui/badge'

const MAX_UPLOAD_FILES = 10
const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024 * 1024
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? ''

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

function resolveAssetUrl(url?: string | null) {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) {
    if (API_BASE_URL && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(url)) {
      return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, API_BASE_URL)
    }
    return url
  }
  const normalizedUrl = url.startsWith('uploads/') ? `/${url}` : url
  if (normalizedUrl.startsWith('/uploads/') && API_BASE_URL) return `${API_BASE_URL}${normalizedUrl}`
  return normalizedUrl
}

function getAssetUrl(asset?: Pick<Asset, 'publicUrl' | 'storagePath'> | null) {
  return resolveAssetUrl(asset?.publicUrl) ?? resolveAssetUrl(asset?.storagePath ? `/uploads/${asset.storagePath}` : undefined)
}

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
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { errors?: string[]; message?: string } } }).response?.data?.errors?.[0]
          ?? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      toast.error(message ?? 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [qc])

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const firstError = rejections[0]?.errors[0]
    if (firstError?.code === 'too-many-files') {
      toast.error(`Upload up to ${MAX_UPLOAD_FILES} files at once`)
      return
    }
    if (firstError?.code === 'file-too-large') {
      toast.error('Each file can be up to 25 GB')
      return
    }
    toast.error(firstError?.message ?? 'Some files could not be uploaded')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
      'audio/*': ['.mp3', '.m4a', '.ogg', '.wav', '.aac', '.flac'],
      'video/*': ['.mp4', '.mov', '.webm', '.m4v'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: MAX_UPLOAD_FILES,
    maxSize: MAX_UPLOAD_SIZE_BYTES,
    multiple: true,
  })

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied')
  }

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success('Asset ID copied')
  }

  const selectedAssetUrl = getAssetUrl(selected)
  const downloadFileName = selected?.originalFileName || selected?.fileName || 'media-asset'

  const assetIcon = (asset: Asset) => {
    if (asset.assetType === 'Audio') return <Music size={24} className="text-sacred-400" />
    if (asset.assetType === 'Video') return <Video size={24} className="text-sacred-400" />
    if (asset.assetType === 'Document') return <FileText size={24} className="text-sacred-400" />
    return <ImageIcon size={24} className="text-sacred-400" />
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
        <p className="text-xs text-sacred-400 mt-1">Images, audio, video, PDFs · up to 10 files · 25 GB each</p>
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

      <div className="flex gap-6 lg:items-start">
        {/* Asset grid/list */}
        <div className="flex-1 min-w-0">
          {view === 'grid' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {isLoading && [...Array(12)].map((_, i) => (
                <div key={i} className="aspect-square bg-sacred-100 rounded-xl animate-pulse" />
              ))}
              {!isLoading && (data?.items ?? []).map((asset) => {
                const assetUrl = getAssetUrl(asset)
                return (
                  <button
                    key={asset.id}
                    onClick={() => setSelected(asset)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selected?.id === asset.id ? 'border-yoga-500 shadow-glow' : 'border-transparent hover:border-sacred-200'
                    }`}
                  >
                    {asset.assetType === 'Image' && assetUrl ? (
                      <img
                        src={assetUrl}
                        alt={asset.altText ?? asset.fileName}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-sacred-100 flex flex-col items-center justify-center gap-1 p-2">
                        {assetIcon(asset)}
                        <span className="text-[9px] text-sacred-500 truncate w-full text-center px-1 leading-tight">
                          {asset.originalFileName}
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
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
                        {formatFileSize(asset.fileSize)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => copyId(asset.id)}
                            className="p-1.5 text-sacred-400 hover:text-yoga-600 rounded transition-colors"
                            title="Copy Asset ID (for Digital Studio)"
                          >
                            <Hash size={14} />
                          </button>
                          {asset.publicUrl && (
                            <button
                              onClick={() => copyUrl(getAssetUrl(asset) ?? asset.publicUrl!)}
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
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center lg:static lg:z-auto lg:block lg:w-80 lg:shrink-0 lg:bg-transparent lg:p-0">
            <button
              type="button"
              aria-label="Close asset details"
              className="absolute inset-0 lg:hidden"
              onClick={() => setSelected(null)}
            />
            <Card className="relative z-10 w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto lg:max-h-none lg:max-w-none">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-sacred-800">Asset Details</p>
                <button onClick={() => setSelected(null)} className="text-sacred-400 hover:text-sacred-700">
                  <X size={16} />
                </button>
              </div>
              {selected.assetType === 'Image' && selectedAssetUrl && (
                <div className="aspect-square rounded-xl overflow-hidden bg-sacred-100 mb-4 relative">
                  <img
                    src={selectedAssetUrl}
                    alt={selected.altText ?? selected.originalFileName}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
              {selected.assetType === 'Video' && selectedAssetUrl && (
                <div className="aspect-video rounded-xl overflow-hidden bg-black mb-4">
                  <video
                    key={selected.id}
                    controls
                    preload="metadata"
                    className="h-full w-full"
                    src={selectedAssetUrl}
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              )}
              {selected.assetType !== 'Image' && selected.assetType !== 'Video' && (
                <div className="rounded-xl bg-sacred-100 mb-4 p-6 flex flex-col items-center justify-center gap-2 text-sacred-500">
                  {assetIcon(selected)}
                  <span className="text-xs text-center break-all">{selected.originalFileName}</span>
                </div>
              )}
              <div className="space-y-2 text-xs text-sacred-600">
                <div><span className="font-medium text-sacred-800">File:</span> {selected.originalFileName}</div>
                <div><span className="font-medium text-sacred-800">Type:</span> {selected.contentType}</div>
                <div><span className="font-medium text-sacred-800">Size:</span> {formatFileSize(selected.fileSize)}</div>
                {selected.width && <div><span className="font-medium text-sacred-800">Dimensions:</span> {selected.width} × {selected.height}px</div>}
                {selected.altText && <div><span className="font-medium text-sacred-800">Alt text:</span> {selected.altText}</div>}
              </div>

              {/* Asset ID — useful for Digital Studio */}
              <div className="mt-3 p-2.5 bg-sacred-50 rounded-lg border border-sacred-100">
                <p className="text-[10px] font-semibold text-sacred-500 uppercase tracking-wider mb-1">Asset ID</p>
                <p className="text-[10px] font-mono text-sacred-700 break-all leading-relaxed">{selected.id}</p>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <Button variant="primary" size="sm" fullWidth onClick={() => copyId(selected.id)}>
                  <Hash size={14} /> Copy Asset ID
                </Button>
                {selectedAssetUrl && (
                  <Button variant="secondary" size="sm" fullWidth onClick={() => copyUrl(selectedAssetUrl)}>
                    <Copy size={14} /> Copy URL
                  </Button>
                )}
                {selectedAssetUrl && (
                  <a
                    href={selectedAssetUrl}
                    download={downloadFileName}
                    className="inline-flex w-full select-none items-center justify-center gap-2 rounded-xl bg-yoga-100 px-3 py-1.5 font-body text-sm font-medium tracking-wide text-yoga-800 transition-all duration-200 hover:bg-yoga-200 active:bg-yoga-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yoga-400 focus-visible:ring-offset-2"
                  >
                    <Download size={14} /> Download
                  </a>
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
