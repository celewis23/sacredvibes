import { headers } from 'next/headers'
import { resolveBrandFromHost } from '@/lib/brand/resolution'
import { apiClient } from '@/lib/api/client'
import GalleryGrid from '@/components/gallery/GalleryGrid'
import type { ApiResponse, Gallery, GalleryItem, Asset } from '@/types'

export const revalidate = 300

async function getGalleries(brandId: string): Promise<Gallery[]> {
  try {
    const res = await apiClient.get<ApiResponse<Gallery[]>>('/galleries', {
      params: { brandId, isActive: true },
    })
    return res.data.data ?? []
  } catch {
    return []
  }
}

async function getGalleryItems(galleryId: string): Promise<Asset[]> {
  try {
    const res = await apiClient.get<ApiResponse<GalleryItem[]>>(`/galleries/${galleryId}/items`)
    return (res.data.data ?? []).map(item => item.asset)
  } catch {
    return []
  }
}

export default async function GalleryPage() {
  const headersList = await headers()
  const host = headersList.get('host') ?? ''
  const brand = resolveBrandFromHost(host)

  const galleries = await getGalleries(brand.id)
  const activeGalleries = galleries.filter(g => g.isActive)

  // Fetch items for all active galleries in parallel
  const galleryData = await Promise.all(
    activeGalleries.map(async gallery => ({
      gallery,
      assets: await getGalleryItems(gallery.id),
    }))
  )

  const hasContent = galleryData.some(g => g.assets.length > 0)

  return (
    <main className="section">
      <div className="container-sacred">
        <div className="mb-12">
          <h1 className="font-heading text-4xl md:text-5xl text-sacred-900 mb-3">Gallery</h1>
          <p className="text-sacred-600 text-lg">Moments from {brand.name}.</p>
        </div>

        {!hasContent ? (
          <div className="text-center py-20 text-sacred-400">
            <p className="font-heading text-2xl mb-2">Coming soon</p>
            <p className="text-sm">We&apos;re building our gallery — check back soon.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {galleryData
              .filter(g => g.assets.length > 0)
              .map(({ gallery, assets }) => (
                <section key={gallery.id}>
                  <GalleryGrid assets={assets} title={gallery.isDefault ? undefined : gallery.name} />
                  {gallery.description && !gallery.isDefault && (
                    <p className="mt-4 text-sm text-sacred-500 italic">{gallery.description}</p>
                  )}
                </section>
              ))}
          </div>
        )}
      </div>
    </main>
  )
}
