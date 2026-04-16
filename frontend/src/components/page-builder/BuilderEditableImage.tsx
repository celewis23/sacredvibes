'use client'

import { useRef } from 'react'
import { ImagePlus, MoveDiagonal2 } from 'lucide-react'
import { usePageBuilder } from '@/components/page-builder/PageBuilderProvider'
import { num, str } from '@/lib/page-builder/helpers'

export default function BuilderEditableImage({
  sectionId,
  content,
  className = '',
}: {
  sectionId: string
  content: Record<string, unknown>
  className?: string
}) {
  const {
    selectedField,
    selectField,
    updateField,
    replaceImage,
  } = usePageBuilder()

  const resizeStateRef = useRef<{
    startX: number
    startY: number
    startWidth: number
    startHeight: number
  } | null>(null)

  const src = str(content, 'src')
  const alt = str(content, 'alt')
  const caption = str(content, 'caption')
  const fit = str(content, 'fit') || 'cover'
  const focalX = num(content, 'focalX', 50)
  const focalY = num(content, 'focalY', 50)
  const widthPercent = num(content, 'widthPercent', 100)
  const heightPx = num(content, 'heightPx', 0)
  const selected = selectedField?.sectionId === sectionId && selectedField.field === 'src'
  const fitClass = fit === 'contain' ? 'object-contain' : fit === 'fill' ? 'object-fill' : 'object-cover'

  function startResize(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()

    resizeStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startWidth: widthPercent,
      startHeight: heightPx || (event.currentTarget.closest('[data-builder-image-frame]') as HTMLElement | null)?.clientHeight || 320,
    }

    function onMove(moveEvent: PointerEvent) {
      if (!resizeStateRef.current) return
      const frame = event.currentTarget.closest('[data-builder-image-frame]') as HTMLElement | null
      const parentWidth = frame?.parentElement?.clientWidth ?? frame?.clientWidth ?? 1000
      const deltaX = moveEvent.clientX - resizeStateRef.current.startX
      const deltaY = moveEvent.clientY - resizeStateRef.current.startY

      const nextWidth = Math.max(25, Math.min(100, resizeStateRef.current.startWidth + ((deltaX / parentWidth) * 100)))
      const nextHeight = Math.max(180, resizeStateRef.current.startHeight + deltaY)

      updateField(sectionId, 'widthPercent', Math.round(nextWidth))
      updateField(sectionId, 'heightPx', Math.round(nextHeight))
    }

    function onUp() {
      resizeStateRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div
      className={`mx-auto ${className}`}
      style={{ width: `${widthPercent}%` }}
      onClick={(event) => {
        event.stopPropagation()
        selectField({ sectionId, field: 'src', kind: 'image', label: 'Image' })
      }}
      onDoubleClick={(event) => {
        event.stopPropagation()
        replaceImage(sectionId, 'src', src)
      }}
    >
      <div
        data-builder-image-frame
        className={`group relative overflow-hidden border transition-all ${
          selected ? 'ring-2 ring-yoga-400 ring-offset-4 ring-offset-white border-yoga-300' : 'border-sacred-200 hover:border-yoga-200'
        } ${heightPx > 0 ? 'bg-sacred-100' : ''}`}
        style={{
          minHeight: src ? undefined : 220,
          height: heightPx > 0 ? heightPx : undefined,
          borderRadius: '1.5rem',
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className={`w-full ${heightPx > 0 ? 'h-full' : 'h-auto'} ${fitClass}`}
            style={{ objectPosition: `${focalX}% ${focalY}%` }}
          />
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 bg-sacred-50 px-6 text-center text-sacred-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
              <ImagePlus size={20} className="text-yoga-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-sacred-700">Click to add an image</p>
              <p className="mt-1 text-xs">Double-click or use the inspector to replace media.</p>
            </div>
          </div>
        )}

        {selected && (
          <>
            <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] ring-2 ring-yoga-400 ring-inset" />
            <div className="absolute left-4 top-4 flex gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  replaceImage(sectionId, 'src', src)
                }}
                className="rounded-full bg-sacred-950/85 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur"
              >
                {src ? 'Replace image' : 'Add image'}
              </button>
            </div>
            <button
              type="button"
              onPointerDown={startResize}
              className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-sacred-950/85 text-white shadow-lg backdrop-blur"
              title="Resize image"
            >
              <MoveDiagonal2 size={14} />
            </button>
          </>
        )}
      </div>

      {caption && (
        <p className="mt-2 text-center text-sm text-sacred-400">{caption}</p>
      )}
    </div>
  )
}
