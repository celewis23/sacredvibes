import { clsx } from 'clsx'

interface SectionHeadingProps {
  eyebrow?: string
  heading: string
  subheading?: string
  align?: 'left' | 'center'
  colorScheme?: 'yoga' | 'hands' | 'sound'
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
}: SectionHeadingProps) {
  return (
    <div className={clsx('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && (
        <p className={clsx('text-xs font-semibold tracking-widest uppercase mb-3', eyebrowColors[colorScheme])}>
          {eyebrow}
        </p>
      )}
      <h2 className="font-heading text-display-md md:text-display-lg text-sacred-900 leading-tight mb-4 text-balance">
        {heading}
      </h2>
      {subheading && (
        <p className="text-base md:text-lg text-sacred-600 leading-relaxed">
          {subheading}
        </p>
      )}
    </div>
  )
}
