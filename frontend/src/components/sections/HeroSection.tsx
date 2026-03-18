import Link from 'next/link'
import { clsx } from 'clsx'

interface HeroSectionProps {
  eyebrow?: string
  heading: string
  subheading?: string
  primaryCta?: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  colorScheme?: 'yoga' | 'hands' | 'sound'
  variant?: 'centered' | 'left'
  imageUrl?: string
  imageAlt?: string
  overlay?: boolean
}

const schemes = {
  yoga: {
    bg: 'bg-gradient-to-b from-yoga-50 via-sacred-50 to-white',
    eyebrow: 'text-yoga-600',
    accent: 'bg-yoga-700 hover:bg-yoga-800',
    outline: 'border-yoga-300 text-yoga-700 hover:bg-yoga-50',
    decoration: 'bg-yoga-100',
  },
  hands: {
    bg: 'bg-gradient-to-b from-hands-50 via-sacred-50 to-white',
    eyebrow: 'text-hands-600',
    accent: 'bg-hands-700 hover:bg-hands-800',
    outline: 'border-hands-300 text-hands-700 hover:bg-hands-50',
    decoration: 'bg-hands-100',
  },
  sound: {
    bg: 'bg-gradient-to-b from-sound-50 via-sacred-50 to-white',
    eyebrow: 'text-sound-600',
    accent: 'bg-sound-700 hover:bg-sound-800',
    outline: 'border-sound-300 text-sound-700 hover:bg-sound-50',
    decoration: 'bg-sound-100',
  },
}

export default function HeroSection({
  eyebrow,
  heading,
  subheading,
  primaryCta,
  secondaryCta,
  colorScheme = 'yoga',
  variant = 'centered',
  imageUrl,
  imageAlt,
}: HeroSectionProps) {
  const scheme = schemes[colorScheme]

  return (
    <section className={clsx('relative min-h-[85vh] flex items-center pt-20', scheme.bg)}>
      {/* Decorative circles */}
      <div className={clsx('absolute top-20 right-10 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none', scheme.decoration)} />
      <div className={clsx('absolute bottom-10 left-5 w-72 h-72 rounded-full opacity-15 blur-3xl pointer-events-none', scheme.decoration)} />

      <div className="container-sacred relative z-10 w-full">
        <div className={clsx(
          'max-w-4xl',
          variant === 'centered' ? 'mx-auto text-center' : 'text-left'
        )}>
          {eyebrow && (
            <p className={clsx(
              'text-sm font-medium tracking-widest uppercase mb-4 animate-fade-in',
              scheme.eyebrow
            )}>
              {eyebrow}
            </p>
          )}

          <h1 className="font-heading text-display-xl md:text-display-2xl text-sacred-900 leading-tight mb-6 animate-slide-up text-balance">
            {heading}
          </h1>

          {subheading && (
            <p className="text-lg md:text-xl text-sacred-600 max-w-2xl leading-relaxed mb-10 animate-fade-in mx-auto">
              {subheading}
            </p>
          )}

          {(primaryCta || secondaryCta) && (
            <div className={clsx(
              'flex flex-col sm:flex-row gap-4 animate-slide-up',
              variant === 'centered' && 'justify-center'
            )}>
              {primaryCta && (
                <Link
                  href={primaryCta.href}
                  className={clsx(
                    'px-8 py-3.5 rounded-xl font-medium text-white shadow-sm transition-all duration-200',
                    scheme.accent
                  )}
                >
                  {primaryCta.label}
                </Link>
              )}
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className={clsx(
                    'px-8 py-3.5 rounded-xl font-medium border bg-transparent transition-all duration-200',
                    scheme.outline
                  )}
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  )
}
