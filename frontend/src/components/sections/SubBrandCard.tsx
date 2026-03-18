import Link from 'next/link'
import { clsx } from 'clsx'

interface SubBrandCardProps {
  name: string
  tagline: string
  description: string
  href: string
  ctaLabel: string
  colorScheme: 'hands' | 'sound'
  services: string[]
}

const schemes = {
  hands: {
    bg: 'bg-gradient-to-br from-hands-50 to-sacred-50',
    border: 'border-hands-100',
    badge: 'bg-hands-100 text-hands-700',
    cta: 'bg-hands-700 hover:bg-hands-800 text-white',
    dot: 'bg-hands-400',
    heading: 'text-hands-900',
  },
  sound: {
    bg: 'bg-gradient-to-br from-sound-50 to-sacred-50',
    border: 'border-sound-100',
    badge: 'bg-sound-100 text-sound-700',
    cta: 'bg-sound-700 hover:bg-sound-800 text-white',
    dot: 'bg-sound-400',
    heading: 'text-sound-900',
  },
}

export default function SubBrandCard({
  name, tagline, description, href, ctaLabel, colorScheme, services
}: SubBrandCardProps) {
  const scheme = schemes[colorScheme]

  return (
    <div className={clsx(
      'rounded-3xl border p-8 md:p-10 transition-all duration-300 hover:shadow-card',
      scheme.bg, scheme.border
    )}>
      <p className="text-xs font-semibold tracking-widest uppercase text-sacred-500 mb-2">{tagline}</p>
      <h3 className={clsx('font-heading text-3xl md:text-4xl font-semibold mb-4', scheme.heading)}>{name}</h3>
      <p className="text-sacred-600 leading-relaxed mb-8">{description}</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {services.map((s) => (
          <span key={s} className={clsx('text-xs font-medium px-3 py-1 rounded-full', scheme.badge)}>
            {s}
          </span>
        ))}
      </div>

      <Link
        href={href}
        className={clsx(
          'inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium shadow-sm transition-all duration-200',
          scheme.cta
        )}
      >
        {ctaLabel}
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
    </div>
  )
}
