'use client'

import Link from 'next/link'
import { Reorder } from 'framer-motion'
import type { JSX as ReactJSX } from 'react'
import EditableText from '@/components/page-editor/EditableText'
import { useOptionalPageEditor } from '@/components/page-editor/PageEditorProvider'
import BuilderEditableImage from '@/components/page-builder/BuilderEditableImage'
import BuilderEditableText from '@/components/page-builder/BuilderEditableText'
import BuilderSectionShell from '@/components/page-builder/BuilderSectionShell'
import { useOptionalPageBuilder } from '@/components/page-builder/PageBuilderProvider'
import {
  bgCls,
  bool,
  isDark,
  mbCls,
  mtCls,
  num,
  parseSections,
  pyCls,
  radiusCls,
  str,
} from '@/lib/page-builder/helpers'
import type { Asset, EventOffering, ServiceOffering } from '@/types'
import type { PageBuilderLiveData, Section } from '@/lib/page-builder/types'

export default function PageSectionRenderer({
  contentJson,
  sections,
  liveData,
}: {
  contentJson?: string
  sections?: Section[]
  liveData?: PageBuilderLiveData
}) {
  const builder = useOptionalPageBuilder()
  const editor = useOptionalPageEditor()
  const resolvedSections = editor?.sections ?? sections ?? parseSections(contentJson)
  const visibleSections = builder ? resolvedSections : resolvedSections.filter((section) => !section.hidden)

  if (builder) {
    return (
      <Reorder.Group
        axis="y"
        values={resolvedSections}
        onReorder={builder.reorderSections}
        className="outline-none"
      >
        {visibleSections.map((section, index) => (
          <BuilderSectionShell
            key={section.id}
            section={section}
            index={index}
            total={visibleSections.length}
          >
            <SectionSurface section={section} liveData={liveData ?? builder.liveData} />
          </BuilderSectionShell>
        ))}
      </Reorder.Group>
    )
  }

  return (
    <>
      {visibleSections.map((section) => (
        <SectionSurface key={section.id} section={section} liveData={liveData} />
      ))}
    </>
  )
}

function SectionSurface({
  section,
  liveData,
}: {
  section: Section
  liveData?: PageBuilderLiveData
}) {
  const builder = useOptionalPageBuilder()
  const { bg, paddingY, marginTop, marginBottom, radius } = section.style
  const dark = isDark(bg)
  const shellClassName = `${bgCls(bg)} ${pyCls(paddingY)} ${mtCls(marginTop)} ${mbCls(marginBottom)} ${radiusCls(radius)} ${
    (radius ?? 'none') !== 'none' ? 'overflow-hidden' : ''
  }`

  if (section.type === 'hero') {
    return <HeroSectionSurface section={section} />
  }

  return (
    <section
      className={shellClassName}
      onClick={() => {
        if (builder) builder.selectSection(section.id)
      }}
    >
      <div className="container-sacred">
        {section.type === 'heading' && <HeadingBlock section={section} dark={dark} />}
        {section.type === 'text' && <TextBlock section={section} dark={dark} />}
        {section.type === 'image' && <ImageBlock section={section} />}
        {section.type === 'two-column' && <TwoColumnBlock section={section} dark={dark} />}
        {section.type === 'services' && <ServicesBlock section={section} dark={dark} services={liveData?.services ?? []} />}
        {section.type === 'events' && <EventsBlock section={section} dark={dark} events={liveData?.events ?? []} />}
        {section.type === 'gallery' && <GalleryBlock section={section} dark={dark} assets={liveData?.galleryAssets ?? []} />}
        {section.type === 'cta' && <CtaBlock section={section} />}
        {section.type === 'quote' && <QuoteBlock section={section} dark={dark} />}
        {section.type === 'divider' && <DividerBlock dark={dark} />}
      </div>
    </section>
  )
}

function HeroSectionSurface({ section }: { section: Section }) {
  const builder = useOptionalPageBuilder()
  const c = section.content
  const backgroundImage = str(c, 'backgroundImage')
  const overlayOpacity = num(c, 'overlayOpacity', 0.4)
  const marginTop = section.style.marginTop
  const marginBottom = section.style.marginBottom
  const radius = section.style.radius

  return (
    <section
      className={`relative min-h-[75vh] overflow-hidden bg-sacred-900 ${mtCls(marginTop)} ${mbCls(marginBottom)} ${radiusCls(radius)} ${
        (radius ?? 'none') !== 'none' ? 'overflow-hidden' : ''
      }`}
      onClick={() => {
        if (builder) builder.selectSection(section.id)
      }}
    >
      {backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})`, opacity: Math.max(0.15, 1 - overlayOpacity / 2) }}
        />
      ) : (
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1c1714 0%, #2a1e18 35%, #1f1a16 65%, #161210 100%)' }} />
          <div className="orb w-[700px] h-[700px] bg-yoga-700" style={{ top: '-150px', right: '-180px', opacity: 0.12 }} />
          <div className="orb w-[500px] h-[500px] bg-yoga-600" style={{ bottom: '-100px', left: '-120px', opacity: 0.09 }} />
        </div>
      )}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, rgba(0,0,0,${Math.min(0.8, overlayOpacity + 0.1)}) 0%, rgba(0,0,0,${overlayOpacity / 2}) 40%, rgba(0,0,0,${Math.min(0.9, overlayOpacity + 0.2)}) 100%)` }}
      />

      <div className="relative z-10 container-sacred flex min-h-[75vh] items-center pt-32 pb-20">
        <div className="mx-auto max-w-3xl text-center">
          {(builder || str(c, 'eyebrow')) && (
            <EditableTextOrView
              sectionId={section.id}
              field="eyebrow"
              label="Eyebrow"
              value={str(c, 'eyebrow')}
              as="p"
              className="eyebrow mb-4 text-yoga-300"
            />
          )}
          <EditableTextOrView
            sectionId={section.id}
            field="headline"
            label="Hero headline"
            value={str(c, 'headline')}
            as="h1"
            className="font-heading text-display-xl md:text-display-2xl text-white leading-tight mb-6 text-balance"
          />
          <span className="gold-line mx-auto mb-8 block w-20" />
          <EditableTextOrView
            sectionId={section.id}
            field="subheading"
            label="Hero subheading"
            value={str(c, 'subheading')}
            as="div"
            richText
            className="mx-auto mb-12 max-w-2xl text-lg font-body font-light leading-relaxed tracking-wide text-white/70"
          />

          {(builder || str(c, 'ctaText') || str(c, 'ctaSecondaryText')) && (
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <CtaButton
                sectionId={section.id}
                textField="ctaText"
                linkField="ctaLink"
                value={str(c, 'ctaText')}
                href={str(c, 'ctaLink')}
                variant="primary"
              />
              <CtaButton
                sectionId={section.id}
                textField="ctaSecondaryText"
                linkField="ctaSecondaryLink"
                value={str(c, 'ctaSecondaryText')}
                href={str(c, 'ctaSecondaryLink')}
                variant="secondary-dark"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function HeadingBlock({ section, dark }: { section: Section; dark: boolean }) {
  const builder = useOptionalPageBuilder()
  const align = str(section.content, 'align') || 'center'
  const alignCls = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'

  return (
    <div className={`mx-auto max-w-2xl ${alignCls}`}>
      {(builder || str(section.content, 'eyebrow')) && (
        <EditableTextOrView
          sectionId={section.id}
          field="eyebrow"
          label="Section eyebrow"
          value={str(section.content, 'eyebrow')}
          as="p"
          className={`eyebrow mb-4 ${dark ? 'text-yoga-300' : 'text-yoga-600'}`}
        />
      )}
      <EditableTextOrView
        sectionId={section.id}
        field="headline"
        label="Section headline"
        value={str(section.content, 'headline')}
        as="h2"
        className={`font-heading text-display-md md:text-display-lg leading-tight mb-4 text-balance ${dark ? 'text-white' : 'text-sacred-900'}`}
      />
      <span className="gold-line mx-auto mb-5 block w-14" />
      <EditableTextOrView
        sectionId={section.id}
        field="subheading"
        label="Section subheading"
        value={str(section.content, 'subheading')}
        as="div"
        richText
        className={`text-base font-body font-light leading-relaxed tracking-wide ${dark ? 'text-white/60' : 'text-sacred-500'}`}
      />
    </div>
  )
}

function TextBlock({ section, dark }: { section: Section; dark: boolean }) {
  return (
    <div className="mx-auto max-w-3xl">
      <EditableTextOrView
        sectionId={section.id}
        field="body"
        label="Body"
        value={str(section.content, 'body')}
        as="div"
        richText
        className={`prose-sacred max-w-none text-base ${dark ? 'text-white/70 [&_*]:text-white/70' : 'text-sacred-700'}`}
      />
    </div>
  )
}

function ImageBlock({ section }: { section: Section }) {
  const builder = useOptionalPageBuilder()

  if (builder) {
    return <BuilderEditableImage sectionId={section.id} content={section.content} />
  }

  const src = str(section.content, 'src')
  const alt = str(section.content, 'alt')
  const caption = str(section.content, 'caption')
  const fit = str(section.content, 'fit') || 'cover'
  const widthPercent = num(section.content, 'widthPercent', 100)
  const heightPx = num(section.content, 'heightPx', 0)
  const focalX = num(section.content, 'focalX', 50)
  const focalY = num(section.content, 'focalY', 50)
  const fitClass = fit === 'contain' ? 'object-contain' : fit === 'fill' ? 'object-fill' : 'object-cover'

  if (!src) return null

  return (
    <div className="mx-auto" style={{ width: `${widthPercent}%` }}>
      <div
        className="overflow-hidden rounded-[1.5rem]"
        style={{ height: heightPx > 0 ? heightPx : undefined }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={`w-full ${heightPx > 0 ? 'h-full' : 'h-auto'} ${fitClass}`}
          style={{ objectPosition: `${focalX}% ${focalY}%` }}
        />
      </div>
      {caption && <p className="mt-3 text-center text-sm text-sacred-400">{caption}</p>}
    </div>
  )
}

function TwoColumnBlock({ section, dark }: { section: Section; dark: boolean }) {
  return (
    <div className="grid items-start gap-12 md:grid-cols-2">
      <div>
        <EditableTextOrView
          sectionId={section.id}
          field="leftHeadline"
          label="Left heading"
          value={str(section.content, 'leftHeadline')}
          as="h3"
          className={`font-heading text-2xl mb-4 ${dark ? 'text-white' : 'text-sacred-900'}`}
        />
        <EditableTextOrView
          sectionId={section.id}
          field="leftBody"
          label="Left body"
          value={str(section.content, 'leftBody')}
          as="div"
          richText
          className={`prose-sacred max-w-none ${dark ? 'text-white/70 [&_*]:text-white/70' : 'text-sacred-600'}`}
        />
      </div>
      <div>
        <EditableTextOrView
          sectionId={section.id}
          field="rightHeadline"
          label="Right heading"
          value={str(section.content, 'rightHeadline')}
          as="h3"
          className={`font-heading text-2xl mb-4 ${dark ? 'text-white' : 'text-sacred-900'}`}
        />
        <EditableTextOrView
          sectionId={section.id}
          field="rightBody"
          label="Right body"
          value={str(section.content, 'rightBody')}
          as="div"
          richText
          className={`prose-sacred max-w-none ${dark ? 'text-white/70 [&_*]:text-white/70' : 'text-sacred-600'}`}
        />
      </div>
    </div>
  )
}

function ServicesBlock({
  section,
  dark,
  services,
}: {
  section: Section
  dark: boolean
  services: ServiceOffering[]
}) {
  const builder = useOptionalPageBuilder()
  const items = services
    .filter((service) => service.isActive)
    .slice(0, Math.max(1, num(section.content, 'maxItems', 6)))

  return (
    <div>
      <div className="mx-auto mb-10 max-w-2xl text-center">
        {(builder || str(section.content, 'eyebrow')) && (
          <EditableTextOrView sectionId={section.id} field="eyebrow" label="Services eyebrow" value={str(section.content, 'eyebrow')} as="p" className={`eyebrow mb-4 ${dark ? 'text-yoga-300' : 'text-yoga-600'}`} />
        )}
        <EditableTextOrView sectionId={section.id} field="headline" label="Services headline" value={str(section.content, 'headline')} as="h2" className={`font-heading text-display-md md:text-display-lg leading-tight mb-4 text-balance ${dark ? 'text-white' : 'text-sacred-900'}`} />
        <EditableTextOrView sectionId={section.id} field="subheading" label="Services subheading" value={str(section.content, 'subheading')} as="div" richText className={`text-base font-body font-light leading-relaxed tracking-wide ${dark ? 'text-white/60' : 'text-sacred-500'}`} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.length > 0
          ? items.map((service) => (
            <div
              key={service.id}
              className={`rounded-[1.75rem] border p-6 shadow-soft ${dark ? 'border-white/10 bg-white/5' : 'border-sacred-100 bg-white'}`}
            >
              <div className={`mb-4 h-10 w-10 rounded-2xl ${dark ? 'bg-yoga-500/25' : 'bg-yoga-100'}`} />
              <h3 className={`font-heading text-2xl mb-2 ${dark ? 'text-white' : 'text-sacred-900'}`}>{service.name}</h3>
              <p className={`mb-5 text-sm leading-relaxed ${dark ? 'text-white/60' : 'text-sacred-500'}`}>
                {service.shortDescription || 'Service description.'}
              </p>
              <div className="flex items-center justify-between border-t border-sacred-100 pt-4">
                <span className={`font-heading text-lg ${dark ? 'text-yoga-300' : 'text-yoga-700'}`}>{formatServicePrice(service)}</span>
                <span className={`text-xs uppercase tracking-[0.16em] ${dark ? 'text-white/40' : 'text-sacred-400'}`}>
                  {service.durationMinutes ? `${service.durationMinutes} min` : 'Session'}
                </span>
              </div>
            </div>
          ))
          : Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`placeholder-${index}`}
              className={`rounded-[1.75rem] border p-6 shadow-soft ${dark ? 'border-white/10 bg-white/5' : 'border-sacred-100 bg-white'}`}
            >
              <div className={`mb-4 h-10 w-10 rounded-2xl ${dark ? 'bg-yoga-500/25' : 'bg-yoga-100'}`} />
              <h3 className={`font-heading text-2xl mb-2 ${dark ? 'text-white' : 'text-sacred-900'}`}>Service name</h3>
              <p className={`mb-5 text-sm leading-relaxed ${dark ? 'text-white/60' : 'text-sacred-500'}`}>Service description.</p>
              <div className="flex items-center justify-between border-t border-sacred-100 pt-4">
                <span className={`font-heading text-lg ${dark ? 'text-yoga-300' : 'text-yoga-700'}`}>$95</span>
                <span className={`text-xs uppercase tracking-[0.16em] ${dark ? 'text-white/40' : 'text-sacred-400'}`}>Session</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

function EventsBlock({
  section,
  dark,
  events,
}: {
  section: Section
  dark: boolean
  events: EventOffering[]
}) {
  const builder = useOptionalPageBuilder()
  const upcomingOnly = bool(section.content, 'upcomingOnly', true)
  const now = Date.now()
  const filtered = events
    .filter((event) => event.isActive)
    .filter((event) => !upcomingOnly || new Date(event.startAt).getTime() >= now)
    .slice(0, Math.max(1, num(section.content, 'maxItems', 4)))

  return (
    <div>
      <div className="mx-auto mb-10 max-w-2xl text-center">
        {(builder || str(section.content, 'eyebrow')) && (
          <EditableTextOrView sectionId={section.id} field="eyebrow" label="Events eyebrow" value={str(section.content, 'eyebrow')} as="p" className={`eyebrow mb-4 ${dark ? 'text-yoga-300' : 'text-yoga-600'}`} />
        )}
        <EditableTextOrView sectionId={section.id} field="headline" label="Events headline" value={str(section.content, 'headline')} as="h2" className={`font-heading text-display-md md:text-display-lg leading-tight mb-4 text-balance ${dark ? 'text-white' : 'text-sacred-900'}`} />
        <EditableTextOrView sectionId={section.id} field="subheading" label="Events subheading" value={str(section.content, 'subheading')} as="div" richText className={`text-base font-body font-light leading-relaxed tracking-wide ${dark ? 'text-white/60' : 'text-sacred-500'}`} />
      </div>

      <div className="space-y-4">
        {filtered.length > 0
          ? filtered.map((event) => (
            <div
              key={event.id}
              className={`flex flex-col gap-5 rounded-[1.75rem] border p-6 shadow-soft sm:flex-row sm:items-center ${dark ? 'border-white/10 bg-white/5' : 'border-sacred-100 bg-white'}`}
            >
              <div className={`rounded-2xl border px-5 py-4 text-center ${dark ? 'border-white/10 bg-sacred-950/40' : 'border-sacred-100 bg-sacred-50'}`}>
                <p className={`text-xs uppercase tracking-[0.18em] ${dark ? 'text-yoga-300' : 'text-yoga-600'}`}>
                  {new Date(event.startAt).toLocaleDateString('en-US', { month: 'short' })}
                </p>
                <p className={`font-heading text-3xl ${dark ? 'text-white' : 'text-sacred-900'}`}>{new Date(event.startAt).getDate()}</p>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className={`font-heading text-2xl mb-2 ${dark ? 'text-white' : 'text-sacred-900'}`}>{event.name}</h3>
                <p className={`text-sm ${dark ? 'text-white/60' : 'text-sacred-500'}`}>
                  {`${new Date(event.startAt).toLocaleDateString()} · ${new Date(event.startAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                </p>
              </div>
              <div className={`text-sm font-medium ${dark ? 'text-yoga-300' : 'text-yoga-700'}`}>{formatEventPrice(event)}</div>
            </div>
          ))
          : Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`placeholder-${index}`}
              className={`flex flex-col gap-5 rounded-[1.75rem] border p-6 shadow-soft sm:flex-row sm:items-center ${dark ? 'border-white/10 bg-white/5' : 'border-sacred-100 bg-white'}`}
            >
              <div className={`rounded-2xl border px-5 py-4 text-center ${dark ? 'border-white/10 bg-sacred-950/40' : 'border-sacred-100 bg-sacred-50'}`}>
                <p className={`text-xs uppercase tracking-[0.18em] ${dark ? 'text-yoga-300' : 'text-yoga-600'}`}>Apr</p>
                <p className={`font-heading text-3xl ${dark ? 'text-white' : 'text-sacred-900'}`}>18</p>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className={`font-heading text-2xl mb-2 ${dark ? 'text-white' : 'text-sacred-900'}`}>Upcoming event</h3>
                <p className={`text-sm ${dark ? 'text-white/60' : 'text-sacred-500'}`}>Friday, April 18 · 6:30 PM</p>
              </div>
              <div className={`text-sm font-medium ${dark ? 'text-yoga-300' : 'text-yoga-700'}`}>$45</div>
            </div>
          ))}
      </div>
    </div>
  )
}

function GalleryBlock({
  section,
  dark,
  assets,
}: {
  section: Section
  dark: boolean
  assets: Asset[]
}) {
  const builder = useOptionalPageBuilder()
  const columns = Math.max(1, Math.min(4, num(section.content, 'columns', 3)))
  const items = assets.slice(0, Math.max(1, num(section.content, 'maxItems', 12)))

  return (
    <div>
      {(builder || str(section.content, 'headline')) && (
        <div className="mb-8 text-center">
          <EditableTextOrView
            sectionId={section.id}
            field="headline"
            label="Gallery headline"
            value={str(section.content, 'headline')}
            as="h2"
            className={`font-heading text-display-md ${dark ? 'text-white' : 'text-sacred-900'}`}
          />
        </div>
      )}

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {items.length > 0
          ? items.map((asset) => (
            <div
              key={asset.id}
              className={`aspect-square overflow-hidden rounded-2xl ${dark ? 'bg-white/10' : 'bg-sacred-100'}`}
            >
              {asset.publicUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getAssetUrl(asset)}
                  alt={asset.altText ?? asset.originalFileName}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          ))
          : Array.from({ length: columns * 2 }).map((_, index) => (
            <div
              key={`placeholder-${index}`}
              className={`aspect-square overflow-hidden rounded-2xl ${dark ? 'bg-white/10' : 'bg-sacred-100'}`}
            />
          ))}
      </div>
    </div>
  )
}

function CtaBlock({ section }: { section: Section }) {
  const builder = useOptionalPageBuilder()
  return (
    <div className="mx-auto max-w-2xl text-center">
      {(builder || str(section.content, 'eyebrow')) && (
        <EditableTextOrView sectionId={section.id} field="eyebrow" label="CTA eyebrow" value={str(section.content, 'eyebrow')} as="p" className="eyebrow mb-4 text-yoga-300" />
      )}
      <EditableTextOrView sectionId={section.id} field="headline" label="CTA headline" value={str(section.content, 'headline')} as="h2" className="font-heading text-display-md md:text-display-lg text-white leading-tight mb-4 text-balance" />
      <span className="gold-line mx-auto mb-6 block w-14" />
      <EditableTextOrView sectionId={section.id} field="subheading" label="CTA subheading" value={str(section.content, 'subheading')} as="div" richText className="mb-8 text-white/60 font-body font-light leading-relaxed" />
      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <CtaButton
          sectionId={section.id}
          textField="ctaText"
          linkField="ctaLink"
          value={str(section.content, 'ctaText')}
          href={str(section.content, 'ctaLink')}
          variant="primary"
        />
        <CtaButton
          sectionId={section.id}
          textField="ctaSecondaryText"
          linkField="ctaSecondaryLink"
          value={str(section.content, 'ctaSecondaryText')}
          href={str(section.content, 'ctaSecondaryLink')}
          variant="secondary-light"
        />
      </div>
    </div>
  )
}

function QuoteBlock({ section, dark }: { section: Section; dark: boolean }) {
  const builder = useOptionalPageBuilder()
  return (
    <div className="mx-auto max-w-2xl text-center">
      <EditableTextOrView
        sectionId={section.id}
        field="text"
        label="Quote"
        value={str(section.content, 'text')}
        as="div"
        richText
        className={`font-heading text-2xl md:text-3xl italic leading-relaxed mb-6 ${dark ? 'text-white' : 'text-sacred-800'}`}
      />
      {(builder || str(section.content, 'author')) && (
        <EditableTextOrView
          sectionId={section.id}
          field="author"
          label="Quote author"
          value={str(section.content, 'author')}
          as="span"
          className={`block text-sm ${dark ? 'text-white/50' : 'text-sacred-400'}`}
        />
      )}
      {(builder || str(section.content, 'source')) && (
        <EditableTextOrView
          sectionId={section.id}
          field="source"
          label="Quote source"
          value={str(section.content, 'source')}
          as="span"
          className={`block text-xs mt-1 ${dark ? 'text-white/35' : 'text-sacred-400'}`}
        />
      )}
    </div>
  )
}

function DividerBlock({ dark }: { dark: boolean }) {
  return <div className={`border-t ${dark ? 'border-white/10' : 'border-sacred-100'}`} />
}

function EditableTextOrView({
  sectionId,
  field,
  value,
  label,
  as = 'div',
  className = '',
  richText = false,
}: {
  sectionId: string
  field: string
  value: string
  label: string
  as?: keyof ReactJSX.IntrinsicElements
  className?: string
  richText?: boolean
}) {
  const builder = useOptionalPageBuilder()

  if (builder) {
    return (
      <BuilderEditableText
        sectionId={sectionId}
        field={field}
        value={value}
        onChange={(next) => builder.updateField(sectionId, field, next)}
        as={as}
        richText={richText}
        label={label}
        className={className}
      />
    )
  }

  return (
    <EditableText
      sectionId={sectionId}
      field={field}
      value={value}
      as={as}
      richText={richText}
      label={label}
      className={className}
    />
  )
}

function CtaButton({
  sectionId,
  textField,
  linkField,
  value,
  href,
  variant,
}: {
  sectionId: string
  textField: string
  linkField: string
  value: string
  href: string
  variant: 'primary' | 'secondary-dark' | 'secondary-light'
}) {
  const builder = useOptionalPageBuilder()
  if (!builder && !value) return null

  const className = variant === 'primary'
    ? 'btn-gold'
    : variant === 'secondary-dark'
      ? 'btn-ghost-dark'
      : 'btn-ghost-light'

  if (builder) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          builder.selectField({ sectionId, field: textField, kind: 'button', label: 'Button label' })
        }}
        className={className}
      >
        <BuilderEditableText
          sectionId={sectionId}
          field={textField}
          value={value}
          onChange={(next) => builder.updateField(sectionId, textField, next)}
          as="span"
          label="Button label"
          multiline={false}
        />
      </button>
    )
  }

  return (
    <Link href={href || '#'} className={className}>
      {value}
    </Link>
  )
}

function formatServicePrice(service: ServiceOffering) {
  if (service.priceType === 'Free') return 'Free'
  if (service.priceType === 'Donation') return 'Donation'
  if (service.priceType === 'SlidingScale' && service.priceMin != null && service.priceMax != null) {
    return `$${service.priceMin} – $${service.priceMax}`
  }
  if (service.price != null) return `$${service.price}`
  return service.priceType
}

function formatEventPrice(event: EventOffering) {
  if (event.priceType === 'Free') return 'Free'
  if (event.priceType === 'Donation') return 'Donation'
  if (event.price != null) return new Intl.NumberFormat('en-US', { style: 'currency', currency: event.currency }).format(event.price)
  return event.priceType
}

function getAssetUrl(asset: Asset) {
  if (asset.variantsJson) {
    try {
      const variants = JSON.parse(asset.variantsJson)
      return variants.medium ?? asset.publicUrl ?? ''
    } catch {
      return asset.publicUrl ?? ''
    }
  }

  return asset.publicUrl ?? ''
}
