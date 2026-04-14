import { clsx } from 'clsx'

interface SectionHeadingProps {
  eyebrow?: string
  heading: string
  subheading?: string
  align?: 'left' | 'center'
  colorScheme?: 'yoga' | 'hands' | 'sound'
  light?: boolean
}

const eyebrowColors = {
  yoga:  'text-yoga-600',
  hands: 'text-hands-600',
  sound: 'text-sound-600',
}

export default function SectionHeading({
  eyebrow,
  heading,
  subheading,
  align = 'left',
  colorScheme = 'yoga',
  light = false,
}: SectionHeadingProps) {
  return (
    <div className={clsx('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && (
        <p className={clsx('eyebrow mb-4', eyebrowColors[colorScheme])}>
          {eyebrow}
        </p>
      )}
      <h2 className={clsx(
        'font-heading text-display-md md:text-display-lg leading-tight mb-4 text-balance',
        light ? 'text-white' : 'text-sacred-900'
      )}>
        {heading}
      </h2>
      {/* Gold accent line */}
      <span className={clsx(
        'gold-line block mb-5',
        align === 'center' ? 'mx-auto w-14' : 'w-12'
      )} />
      {subheading && (
        <p className={clsx(
          'text-base font-body font-light leading-relaxed tracking-wide',
          light ? 'text-white/60' : 'text-sacred-500'
        )}>
          {subheading}
        </p>
      )}
    </div>
  )
}
