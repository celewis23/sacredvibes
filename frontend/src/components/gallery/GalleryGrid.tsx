'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import type { Asset } from '@/types'

interface Props {
  assets: Asset[]
  title?: string
}

function getVariantUrl(asset: Asset, size: 'large' | 'medium' | 'thumbnail' = 'large'): string {
  if (asset.variantsJson) {
    try {
      const variants = JSON.parse(asset.variantsJson)
      return variants[size] ?? asset.publicUrl ?? ''
    } catch { /* fall through */ }
  }
  return asset.publicUrl ?? ''
}

export default function GalleryGrid({ assets, title }: Props) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const slides = assets.map((asset) => ({
    src: getVariantUrl(asset, 'large'),
    alt: asset.altText ?? asset.originalFileName,
    width: asset.width ?? 1200,
    height: asset.height ?? 900,
  }))

  const openAt = useCallback((i: number) => {
    setIndex(i)
    setOpen(true)
  }, [])

  if (!assets.length) {
    return (
      <div className="text-center py-20 text-sacred-400">
        <p className="font-heading text-2xl mb-2">No images yet</p>
        <p className="text-sm">Check back soon — we&apos;re always adding new moments.</p>
      </div>
    )
  }

  return (
    <>
      {title && (
        <h2 className="font-heading text-3xl text-sacred-900 mb-8">{title}</h2>
      )}

      <div className="gallery-masonry">
        {assets.map((asset, i) => (
          <div
            key={asset.id}
            className="gallery-item"
            onClick={() => openAt(i)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openAt(i)}
            aria-label={`View ${asset.altText ?? asset.originalFileName}`}
          >
            <div className="relative" style={{ paddingBottom: `${((asset.height ?? 3) / (asset.width ?? 4)) * 100}%` }}>
              <Image
                src={getVariantUrl(asset, 'medium')}
                alt={asset.altText ?? asset.originalFileName}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
                loading="lazy"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-sacred-900/0 hover:bg-sacred-900/20 transition-colors duration-200" />
            </div>
            {asset.caption && (
              <div className="p-3">
                <p className="text-xs text-sacred-600">{asset.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
        styles={{ container: { backgroundColor: 'rgba(0,0,0,0.92)' } }}
      />
    </>
  )
}
