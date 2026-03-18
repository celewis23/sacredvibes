'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { apiClient } from '@/lib/api/client'
import type { ApiResponse, Gallery, GalleryItem } from '@/types'

function getThumb(item: GalleryItem): string {
  if (item.asset.variantsJson) {
    try {
      const v = JSON.parse(item.asset.variantsJson)
      return v.thumbnail ?? v.medium ?? item.asset.publicUrl ?? ''
    } catch { /* fall through */ }
  }
  return item.asset.publicUrl ?? ''
}

export default function AdminGalleriesPage() {
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null)

  const { data: galleries, isLoading } = useQuery({
    queryKey: ['admin-galleries'],
    queryFn: () =>
      apiClient.get<ApiResponse<Gallery[]>>('/galleries')
        .then(r => r.data.data ?? []),
  })

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['admin-gallery-items', selectedGallery?.id],
    queryFn: () =>
      apiClient.get<ApiResponse<GalleryItem[]>>(`/galleries/${selectedGallery!.id}/items`)
        .then(r => r.data.data ?? []),
    enabled: !!selectedGallery,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Galleries</h1>
          <p className="text-sm text-gray-500 mt-1">Manage photo galleries per brand</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Gallery list */}
        <div className="col-span-1">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Galleries</h2>
          {isLoading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (galleries ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">No galleries yet.</p>
          ) : (
            <div className="space-y-1">
              {(galleries ?? []).map(gallery => (
                <button
                  key={gallery.id}
                  onClick={() => setSelectedGallery(gallery)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    selectedGallery?.id === gallery.id
                      ? 'bg-sacred-800 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">{gallery.name}</div>
                  <div className={`text-xs mt-0.5 ${selectedGallery?.id === gallery.id ? 'text-sacred-200' : 'text-gray-400'}`}>
                    {gallery.isDefault ? 'Default · ' : ''}{gallery.isActive ? 'Active' : 'Inactive'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Gallery items */}
        <div className="col-span-3">
          {!selectedGallery ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
              Select a gallery to view its images
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{selectedGallery.name}</h2>
                {selectedGallery.description && (
                  <p className="text-sm text-gray-500">{selectedGallery.description}</p>
                )}
              </div>

              {itemsLoading ? (
                <div className="p-12 text-center text-gray-400 text-sm">Loading images...</div>
              ) : (items ?? []).length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                  No images in this gallery yet.
                  <br />Upload images from the Media Library with &quot;Add to Gallery&quot; enabled.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {(items ?? []).map((item) => (
                    <div key={item.assetId} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={getThumb(item)}
                        alt={item.asset.altText ?? item.asset.originalFileName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 640px) 33vw, 25vw"
                      />
                      {item.isFeatured && (
                        <div className="absolute top-1.5 left-1.5">
                          <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded font-medium">
                            Featured
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
