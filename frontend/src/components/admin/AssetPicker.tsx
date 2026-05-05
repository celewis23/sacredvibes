'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import {
  X, Search, Upload, Image as ImageIcon, Music, Video, FileText, Check
} from 'lucide-react'
import NextImage from 'next/image'
import { assetsApi } from '@/lib/api'
import type { Asset, AssetType } from '@/types'

interface AssetPickerProps {
  value?: string
  onChange: (id: string | undefined) => void
  accept?: 'image' | 'audio' | 'video' | 'any'
  label?: string
}

const ACCEPT_MAP: Record<string, string[]> = {
  image: ['Image'],
  audio: ['Audio'],
  video: ['Video'],
  any: ['Image', 'Audio', 'Video', 'Document', 'Other'],
}

const MIME_MAP: Record<string, Record<string, string[]>> = {
  image: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
  audio: { 'audio/*': ['.mp3', '.m4a', '.ogg', '.wav', '.aac', '.flac'] },
  video: { 'video/*': ['.mp4', '.mov', '.webm', '.m4v'] },
  any: {
    'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    'audio/*': ['.mp3', '.m4a', '.ogg', '.wav', '.aac', '.flac'],
    'video/*': ['.mp4', '.mov', '.webm', '.m4v'],
  },
}

function AssetIcon({ type, className = '' }: { type: AssetType; className?: string }) {
  if (type === 'Image') return <ImageIcon className={className} />
  if (type === 'Audio') return <Music className={className} />
  if (type === 'Video') return <Video className={className} />
  return <FileText className={className} />
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

export default function AssetPicker({ value, onChange, accept = 'any', label }: AssetPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isUploading, setIsUploading] = useState(false)
  const qc = useQueryClient()

  const allowedTypes = ACCEPT_MAP[accept]

  const { data: currentAsset } = useQuery({
    queryKey: ['asset', value],
    queryFn: async () => {
      if (!value) return null
      const res = await assetsApi.getAsset(value)
      return res.data?.data ?? null
    },
    enabled: !!value,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['assets-picker', page, search, accept],
    queryFn: async () => {
      const res = await assetsApi.getAssets({ page, pageSize: 24, search: search || undefined })
      return res.data?.data
    },
    enabled: open,
  })

  const items = (data?.items ?? []).filter(a => allowedTypes.includes(a.assetType))

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return
    setIsUploading(true)
    const fd = new FormData()
    acceptedFiles.forEach(f => fd.append('files', f))
    fd.append('visibility', 'Public')
    fd.append('usage', 'StudioContent')
    try {
      const res = await assetsApi.upload(fd)
      toast.success(`${acceptedFiles.length} file${acceptedFiles.length > 1 ? 's' : ''} uploaded`)
      qc.invalidateQueries({ queryKey: ['assets-picker'] })
      qc.invalidateQueries({ queryKey: ['assets'] })
      const uploaded = res.data?.data
      if (uploaded?.length === 1) {
        onChange(uploaded[0].id)
        setOpen(false)
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [qc, onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: MIME_MAP[accept],
    maxSize: 500 * 1024 * 1024,
    multiple: false,
  })

  const select = (asset: Asset) => {
    onChange(asset.id)
    setOpen(false)
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(undefined)
  }

  return (
    <>
      {label && (
        <label className="block text-sm font-medium text-sacred-700 mb-1">{label}</label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-sacred-200 bg-white text-left text-sm hover:border-yoga-400 transition-colors"
      >
        {currentAsset ? (
          <>
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-sacred-100 shrink-0 flex items-center justify-center">
              {currentAsset.assetType === 'Image' && currentAsset.publicUrl ? (
                <NextImage
                  src={currentAsset.publicUrl}
                  alt={currentAsset.altText ?? ''}
                  width={40} height={40}
                  className="object-cover w-full h-full"
                />
              ) : (
                <AssetIcon type={currentAsset.assetType} className="w-5 h-5 text-sacred-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sacred-900 font-medium truncate">{currentAsset.originalFileName}</p>
              <p className="text-xs text-sacred-400">{currentAsset.assetType} · {formatSize(currentAsset.fileSize)}</p>
            </div>
            <button
              type="button"
              onClick={clear}
              className="shrink-0 text-sacred-400 hover:text-sacred-700 p-1"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-lg bg-sacred-100 shrink-0 flex items-center justify-center">
              <Upload size={16} className="text-sacred-400" />
            </div>
            <span className="text-sacred-400">Choose from library or upload…</span>
          </>
        )}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-sacred-100">
              <h2 className="text-base font-semibold text-sacred-900">
                {label ?? 'Choose Asset'}
              </h2>
              <button onClick={() => setOpen(false)} className="text-sacred-400 hover:text-sacred-700">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Upload drop zone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-yoga-400 bg-yoga-50' : 'border-sacred-200 hover:border-yoga-300 hover:bg-sacred-50/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload size={18} className="mx-auto mb-1 text-sacred-400" />
                <p className="text-sm text-sacred-600">
                  {isUploading ? 'Uploading…' : isDragActive ? 'Drop file here' : 'Drag & drop to upload, or click to browse files'}
                </p>
                <p className="text-xs text-sacred-400 mt-0.5">Up to 500 MB · {accept === 'any' ? 'Images, audio, video' : accept}</p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sacred-400" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search files…"
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-sacred-200 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
                />
              </div>

              {/* Grid */}
              {isLoading ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="aspect-square bg-sacred-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12 text-sacred-400 text-sm">
                  No {accept === 'any' ? 'assets' : accept + ' files'} found
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {items.map(asset => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => select(asset)}
                      title={asset.originalFileName}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:border-yoga-400 ${
                        value === asset.id ? 'border-yoga-500 ring-2 ring-yoga-300' : 'border-transparent'
                      }`}
                    >
                      {asset.assetType === 'Image' && asset.publicUrl ? (
                        <NextImage
                          src={asset.publicUrl}
                          alt={asset.altText ?? asset.fileName}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      ) : (
                        <div className="w-full h-full bg-sacred-100 flex flex-col items-center justify-center gap-1 p-2">
                          <AssetIcon type={asset.assetType} className="w-6 h-6 text-sacred-400" />
                          <span className="text-[9px] text-sacred-500 truncate w-full text-center px-1 leading-tight">
                            {asset.originalFileName}
                          </span>
                        </div>
                      )}
                      {value === asset.id && (
                        <div className="absolute inset-0 bg-yoga-600/20 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-yoga-600 flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-sacred-500">Page {page} of {data.totalPages}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!data.hasPreviousPage}
                      onClick={() => setPage(p => p - 1)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-sacred-200 disabled:opacity-40 hover:bg-sacred-50 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={!data.hasNextPage}
                      onClick={() => setPage(p => p + 1)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-sacred-200 disabled:opacity-40 hover:bg-sacred-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
