import { clsx } from 'clsx'

export type SacredIconName =
  | 'sound-healing'
  | 'yoga-flows'
  | 'breathwork'
  | 'meditation'
  | 'location'
  | 'envelope'
  | 'travel'
  | 'relax-release'
  | 'heal-restore'
  | 'elevate-energy'
  | 'move-body'
  | 'sound-on-the-river'
  | 'bodywork'
  | 'wellness'
  | 'private-sound-healing'
  | 'yoga'
  | 'energy-work'
  | 'guided-meditation'
  | 'ceremonies-rituals'
  | 'custom-activation'

interface SacredIconProps {
  name: SacredIconName
  className?: string
  label?: string
}

export default function SacredIcon({ name, className, label }: SacredIconProps) {
  const href = `/images/sacred-vibes-icon-pack.svg#${name}`

  return (
    <svg
      viewBox="0 0 64 64"
      className={clsx('w-10 h-10 text-current', className)}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <use href={href} xlinkHref={href} />
    </svg>
  )
}
