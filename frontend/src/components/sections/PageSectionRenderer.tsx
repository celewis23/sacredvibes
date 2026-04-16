import Link from 'next/link'

// ── Types (mirrors admin editor) ──────────────────────────────────────────────

interface SectionStyle {
  bg: 'white' | 'soft' | 'dark' | 'accent'
  paddingY: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

interface Section {
  id: string
  type: string
  content: Record<string, unknown>
  style: SectionStyle
  hidden?: boolean
}

// ── Style helpers ─────────────────────────────────────────────────────────────

function bgCls(bg: string) {
  return bg === 'dark' ? 'bg-sacred-900' : bg === 'soft' ? 'bg-sacred-50' : bg === 'accent' ? 'bg-yoga-700' : 'bg-white'
}
function pyCls(p: string) {
  return p === 'none' ? 'py-0' : p === 'sm' ? 'py-8' : p === 'md' ? 'py-12' : p === 'lg' ? 'py-16' : 'py-24'
}
function str(v: unknown): string { return typeof v === 'string' ? v : '' }
function isDark(bg: string) { return bg === 'dark' || bg === 'accent' }

// ── Section renderers ─────────────────────────────────────────────────────────

function HeroBlock({ c }: { c: Record<string, unknown> }) {
  return (
    <section data-header="dark" className="relative min-h-[75vh] flex items-center overflow-hidden bg-sacred-900">
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1c1714 0%, #2a1e18 35%, #1f1a16 65%, #161210 100%)' }} />
        <div className="orb w-[700px] h-[700px] bg-yoga-700" style={{ top: '-150px', right: '-180px', opacity: 0.12 }} />
        <div className="orb w-[500px] h-[500px] bg-yoga-600" style={{ bottom: '-100px', left: '-120px', opacity: 0.09 }} />
      </div>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.4) 100%)' }} />

      <div className="relative z-10 container-sacred w-full pt-32 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          {str(c.eyebrow) && (
            <div className="inline-flex items-center gap-3 mb-8">
              <span className="w-8 h-px bg-yoga-400/70" />
              <span className="eyebrow text-yoga-300">{str(c.eyebrow)}</span>
              <span className="w-8 h-px bg-yoga-400/70" />
            </div>
          )}
          <h1 className="font-heading text-display-xl md:text-display-2xl text-white leading-tight mb-6 text-balance">
            {str(c.headline)}
          </h1>
          <span className="gold-line w-20 block mx-auto mb-8" />
          {str(c.subheading) && (
            <p className="text-lg text-white/70 leading-relaxed mb-12 font-body font-light tracking-wide max-w-2xl mx-auto">
              {str(c.subheading)}
            </p>
          )}
          {(str(c.ctaText) || str(c.ctaSecondaryText)) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {str(c.ctaText) && <Link href={str(c.ctaLink) || '#'} className="btn-gold">{str(c.ctaText)}</Link>}
              {str(c.ctaSecondaryText) && <Link href={str(c.ctaSecondaryLink) || '#'} className="btn-ghost-light">{str(c.ctaSecondaryText)}</Link>}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function HeadingBlock({ c, dark }: { c: Record<string, unknown>; dark: boolean }) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      {str(c.eyebrow) && (
        <p className={`eyebrow mb-4 ${dark ? 'text-yoga-300' : 'text-yoga-600'}`}>{str(c.eyebrow)}</p>
      )}
      <h2 className={`font-heading text-display-md md:text-display-lg leading-tight mb-4 text-balance ${dark ? 'text-white' : 'text-sacred-900'}`}>
        {str(c.headline)}
      </h2>
      <span className="gold-line block mx-auto w-14 mb-5" />
      {str(c.subheading) && (
        <p className={`text-base font-body font-light leading-relaxed tracking-wide ${dark ? 'text-white/60' : 'text-sacred-500'}`}>
          {str(c.subheading)}
        </p>
      )}
    </div>
  )
}

function renderBody(text: string, dark: boolean) {
  const cls = `leading-relaxed ${dark ? 'text-white/70' : 'text-sacred-600'}`
  if (text.startsWith('<') && text.includes('</')) {
    return <div className={cls} dangerouslySetInnerHTML={{ __html: text }} />
  }
  return <p className={`${cls} whitespace-pre-wrap`}>{text}</p>
}

function TwoColumnBlock({ c, dark }: { c: Record<string, unknown>; dark: boolean }) {
  return (
    <div className="grid md:grid-cols-2 gap-12 items-start">
      <div>
        {str(c.leftHeadline) && (
          <h3 className={`font-heading text-2xl mb-4 ${dark ? 'text-white' : 'text-sacred-900'}`}>{str(c.leftHeadline)}</h3>
        )}
        {renderBody(str(c.leftBody), dark)}
      </div>
      <div>
        {str(c.rightHeadline) && (
          <h3 className={`font-heading text-2xl mb-4 ${dark ? 'text-white' : 'text-sacred-900'}`}>{str(c.rightHeadline)}</h3>
        )}
        {renderBody(str(c.rightBody), dark)}
      </div>
    </div>
  )
}

function CtaBlock({ c }: { c: Record<string, unknown> }) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      {str(c.eyebrow) && <p className="eyebrow text-yoga-300 mb-4">{str(c.eyebrow)}</p>}
      <h2 className="font-heading text-display-md md:text-display-lg text-white leading-tight mb-4 text-balance">{str(c.headline)}</h2>
      <span className="gold-line block mx-auto w-14 mb-6" />
      {str(c.subheading) && <p className="text-white/60 leading-relaxed mb-8 font-body font-light">{str(c.subheading)}</p>}
      {(str(c.ctaText) || str(c.ctaSecondaryText)) && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {str(c.ctaText) && <Link href={str(c.ctaLink) || '#'} className="btn-gold">{str(c.ctaText)}</Link>}
          {str(c.ctaSecondaryText) && <Link href={str(c.ctaSecondaryLink) || '#'} className="btn-ghost-light">{str(c.ctaSecondaryText)}</Link>}
        </div>
      )}
    </div>
  )
}

function QuoteBlock({ c, dark }: { c: Record<string, unknown>; dark: boolean }) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <p className={`font-heading text-2xl md:text-3xl italic leading-relaxed mb-6 ${dark ? 'text-white' : 'text-sacred-800'}`}>
        &ldquo;{str(c.text)}&rdquo;
      </p>
      {str(c.author) && (
        <p className={`text-sm ${dark ? 'text-white/50' : 'text-sacred-400'}`}>
          — {str(c.author)}{str(c.source) ? `, ${str(c.source)}` : ''}
        </p>
      )}
    </div>
  )
}

function SectionBlock({ section }: { section: Section }) {
  const { bg, paddingY } = section.style
  const c = section.content
  const dark = isDark(bg)
  const cls = `${bgCls(bg)} ${pyCls(paddingY)}`

  switch (section.type) {
    case 'hero':
      return <HeroBlock c={c} />

    case 'heading':
      return (
        <section className={cls}>
          <div className="container-sacred">
            <HeadingBlock c={c} dark={dark} />
          </div>
        </section>
      )

    case 'text': {
      const body = str(c.body)
      const isHtml = body.startsWith('<') && body.includes('</')
      return (
        <section className={cls}>
          <div className="container-sacred max-w-3xl mx-auto">
            {isHtml
              ? <div className={`leading-relaxed text-base ${dark ? 'text-white/70' : 'text-sacred-700'}`} dangerouslySetInnerHTML={{ __html: body }} />
              : <p className={`leading-relaxed whitespace-pre-wrap text-base ${dark ? 'text-white/70' : 'text-sacred-700'}`}>{body}</p>
            }
          </div>
        </section>
      )
    }

    case 'image':
      return str(c.src) ? (
        <section className={cls}>
          <div className="container-sacred max-w-4xl mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={str(c.src)} alt={str(c.alt)} className="w-full object-cover rounded-xl" />
            {str(c.caption) && <p className="text-sm text-sacred-400 mt-3 text-center">{str(c.caption)}</p>}
          </div>
        </section>
      ) : null

    case 'two-column':
      return (
        <section className={cls}>
          <div className="container-sacred">
            <TwoColumnBlock c={c} dark={dark} />
          </div>
        </section>
      )

    case 'cta':
      return (
        <section className={`${bgCls('dark')} ${pyCls(paddingY)}`}>
          <div className="container-sacred">
            <CtaBlock c={c} />
          </div>
        </section>
      )

    case 'quote':
      return (
        <section className={cls}>
          <div className="container-sacred">
            <QuoteBlock c={c} dark={dark} />
          </div>
        </section>
      )

    case 'divider':
      return (
        <section className={cls}>
          <div className="container-sacred">
            <div className={`border-t ${dark ? 'border-white/10' : 'border-sacred-100'}`} />
          </div>
        </section>
      )

    // services / events / gallery sections pull live data — handled by each page individually
    default:
      return null
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function PageSectionRenderer({ contentJson }: { contentJson: string }) {
  let sections: Section[] = []
  try {
    const parsed = JSON.parse(contentJson)
    if (Array.isArray(parsed)) sections = parsed
  } catch { /* invalid json — render nothing */ }

  return (
    <>
      {sections.filter(s => !s.hidden).map(section => (
        <SectionBlock key={section.id} section={section} />
      ))}
    </>
  )
}
