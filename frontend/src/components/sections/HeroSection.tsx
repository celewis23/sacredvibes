'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import PageEditorTextField from '@/components/page-editor/PageEditorTextField'

interface HeroSectionProps {
  eyebrow?: string
  heading: string
  subheading?: string
  primaryCta?: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  colorScheme?: 'yoga' | 'hands' | 'sound'
  variant?: 'centered' | 'left'
  videoUrl?: string
  imageUrl?: string
  editable?: {
    sectionId: string
    eyebrowField?: string
    headingField: string
    subheadingField?: string
  }
}

const PARTICLES = [
  { size: 4, left: '8%',  top: '25%', dur: 7,  delay: 0   },
  { size: 6, left: '20%', top: '60%', dur: 9,  delay: 1.2 },
  { size: 3, left: '35%', top: '20%', dur: 6,  delay: 2.5 },
  { size: 5, left: '55%', top: '70%', dur: 8,  delay: 0.8 },
  { size: 4, left: '70%', top: '30%', dur: 10, delay: 1.7 },
  { size: 3, left: '82%', top: '55%', dur: 7,  delay: 3.1 },
  { size: 6, left: '92%', top: '20%', dur: 9,  delay: 0.5 },
  { size: 4, left: '45%', top: '45%', dur: 8,  delay: 2.0 },
]

export default function HeroSection({
  eyebrow,
  heading,
  subheading,
  primaryCta,
  secondaryCta,
  colorScheme = 'yoga',
  variant = 'centered',
  videoUrl,
  imageUrl,
  editable,
}: HeroSectionProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <section data-header="dark" className="relative min-h-screen flex items-center overflow-hidden bg-sacred-900">

      {/* ── Background Layer ── */}
      {videoUrl ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.55 }}
          autoPlay muted loop playsInline
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : imageUrl ? (
        <div
          className={clsx(
            'absolute inset-0 bg-cover bg-center',
            imageUrl === '/images/hero-bg.png' && 'hero-home-mobile-image'
          )}
          style={{ backgroundImage: `url(${imageUrl})`, opacity: 0.45 }}
        />
      ) : (
        /* Atmospheric cinematic gradient when no video/image */
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, #1c1714 0%, #2a1e18 35%, #1f1a16 65%, #161210 100%)'
          }} />
          {/* Ambient gold orbs */}
          <div className="orb w-[700px] h-[700px] bg-yoga-700"
               style={{ top: '-150px', right: '-180px', opacity: 0.12 }} />
          <div className="orb w-[500px] h-[500px] bg-yoga-600"
               style={{ bottom: '-100px', left: '-120px', opacity: 0.09 }} />
          <div className="orb w-[350px] h-[350px] bg-sage-700"
               style={{ top: '30%', left: '25%', opacity: 0.06 }} />
          <div className="orb w-[250px] h-[250px] bg-yoga-400"
               style={{ top: '60%', right: '20%', opacity: 0.07 }} />
        </div>
      )}

      {/* ── Cinematic Overlays ── */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.4) 100%)' }} />
      {/* Left-side gradient so text pops over a busy image */}
      {variant === 'left' && (
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 50%, transparent 75%)' }} />
      )}

      {/* ── Floating Particles ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-yoga-400/25"
            style={{
              width: p.size,
              height: p.size,
              left: p.left,
              top: p.top,
              animation: `float ${p.dur}s ease-in-out infinite ${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* ── Hero Content ── */}
      <div className="relative z-10 container-sacred w-full pt-28 pb-20">
        <div className={clsx(
          variant === 'centered' ? 'max-w-5xl mx-auto text-center' : 'max-w-xl text-left'
        )}>

          {/* Eyebrow */}
          {eyebrow && (
            <div className={clsx(
              'inline-flex items-center gap-3 mb-8 transition-all duration-1000',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}>
              <span className="w-8 h-px bg-yoga-400/70" />
              {editable?.eyebrowField ? (
                <PageEditorTextField
                  sectionId={editable.sectionId}
                  field={editable.eyebrowField}
                  fallback={eyebrow}
                  as="span"
                  multiline={false}
                  label="Hero eyebrow"
                  className="eyebrow text-yoga-300"
                />
              ) : (
                <span className="eyebrow text-yoga-300">{eyebrow}</span>
              )}
              <span className="w-8 h-px bg-yoga-400/70" />
            </div>
          )}

          {/* Main heading */}
          {editable ? (
            <PageEditorTextField
              sectionId={editable.sectionId}
              field={editable.headingField}
              fallback={heading}
              as="h1"
              multiline={false}
              label="Hero heading"
              className={clsx(
                'font-heading text-display-xl md:text-display-2xl lg:text-display-3xl',
                'text-white leading-[1.02] mb-8 text-balance',
                'transition-all duration-1000 delay-150',
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              )}
            />
          ) : (
            <h1 className={clsx(
              'font-heading text-display-xl md:text-display-2xl lg:text-display-3xl',
              'text-white leading-[1.02] mb-8 text-balance',
              'transition-all duration-1000 delay-150',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}>
              {heading}
            </h1>
          )}

          {/* Gold accent line */}
          <div className={clsx(
            'transition-all duration-1000 delay-300',
            mounted ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0',
            variant === 'centered' && 'flex justify-center'
          )}>
            <span className="gold-line w-20 mb-8" />
          </div>

          {/* Subheading */}
          {subheading && (
            editable?.subheadingField ? (
              <PageEditorTextField
                sectionId={editable.sectionId}
                field={editable.subheadingField}
                fallback={subheading}
                as="p"
                label="Hero subheading"
                className={clsx(
                  'text-base md:text-lg text-white/75 leading-relaxed mb-12',
                  'font-body font-light tracking-widest uppercase',
                  variant === 'centered' ? 'max-w-2xl mx-auto' : 'max-w-sm',
                  'transition-all duration-1000 delay-400',
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                )}
              />
            ) : (
              <p className={clsx(
                'text-base md:text-lg text-white/75 leading-relaxed mb-12',
                'font-body font-light tracking-widest uppercase',
                variant === 'centered' ? 'max-w-2xl mx-auto' : 'max-w-sm',
                'transition-all duration-1000 delay-400',
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}>
                {subheading}
              </p>
            )
          )}

          {/* CTAs */}
          {(primaryCta || secondaryCta) && (
            <div className={clsx(
              'flex flex-col sm:flex-row gap-4',
              variant === 'centered' && 'justify-center',
              'transition-all duration-1000 delay-600',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}>
              {primaryCta && (
                <Link href={primaryCta.href} className="btn-gold">
                  {primaryCta.label}
                </Link>
              )}
              {secondaryCta && (
                <Link href={secondaryCta.href} className="btn-ghost-light">
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <div className={clsx(
        'absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2',
        'transition-all duration-1000 delay-[800ms]',
        mounted ? 'opacity-100' : 'opacity-0'
      )}>
        <span className="text-white/35 text-[10px] tracking-[0.25em] uppercase font-body">Scroll</span>
        <div className="w-px h-14 bg-gradient-to-b from-white/40 to-transparent animate-breathe" />
      </div>
    </section>
  )
}
