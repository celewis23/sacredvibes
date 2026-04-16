import type { ElementType } from 'react'
import type { Asset, EventOffering, ServiceOffering } from '@/types'
import {
  Star, Type, AlignLeft, ImageIcon, Columns2, ShoppingBag,
  CalendarDays, Zap, Quote, Grid2x2, Minus,
} from 'lucide-react'

export type SectionType =
  | 'hero'
  | 'heading'
  | 'text'
  | 'image'
  | 'two-column'
  | 'services'
  | 'events'
  | 'gallery'
  | 'cta'
  | 'quote'
  | 'divider'

export type SpaceScale = 'none' | 'sm' | 'md' | 'lg' | 'xl'

export interface SectionStyle {
  bg: 'white' | 'soft' | 'dark' | 'accent'
  paddingY: SpaceScale
  marginTop?: SpaceScale
  marginBottom?: SpaceScale
  radius?: 'none' | 'lg' | 'xl' | '2xl'
}

export interface Section {
  id: string
  type: SectionType
  content: Record<string, unknown>
  style: SectionStyle
  hidden?: boolean
}

export type BuilderFieldKind =
  | 'text'
  | 'rich-text'
  | 'button'
  | 'link'
  | 'image'
  | 'section'

export interface BuilderFieldSelection {
  sectionId: string
  field: string
  kind: BuilderFieldKind
  label?: string
}

export type BuilderViewport = 'desktop' | 'tablet' | 'mobile'

export interface PageBuilderLiveData {
  services?: ServiceOffering[]
  events?: EventOffering[]
  galleryAssets?: Asset[]
}

export const SECTION_TYPES: Record<SectionType, { label: string; icon: ElementType }> = {
  hero:          { label: 'Hero', icon: Star },
  heading:       { label: 'Heading', icon: Type },
  text:          { label: 'Text Block', icon: AlignLeft },
  image:         { label: 'Image', icon: ImageIcon },
  'two-column':  { label: 'Two Column', icon: Columns2 },
  services:      { label: 'Services', icon: ShoppingBag },
  events:        { label: 'Events', icon: CalendarDays },
  gallery:       { label: 'Gallery', icon: Grid2x2 },
  cta:           { label: 'Call to Action', icon: Zap },
  quote:         { label: 'Quote', icon: Quote },
  divider:       { label: 'Divider', icon: Minus },
}

export const SECTION_PALETTE = (
  Object.entries(SECTION_TYPES) as [SectionType, { label: string; icon: ElementType }][]
).map(([type, meta]) => ({ type, ...meta }))
