import { clsx } from 'clsx'

type BadgeVariant = 'default' | 'yoga' | 'hands' | 'sound' | 'success' | 'warning' | 'danger' | 'neutral'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  className?: string
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-yoga-100 text-yoga-800',
  yoga:     'bg-yoga-100 text-yoga-800',
  hands:    'bg-hands-100 text-hands-800',
  sound:    'bg-sound-100 text-sound-800',
  success:  'bg-green-100 text-green-800',
  warning:  'bg-amber-100 text-amber-800',
  danger:   'bg-red-100 text-red-800',
  neutral:  'bg-sacred-100 text-sacred-700',
}

export default function Badge({ children, variant = 'default', size = 'sm', className, dot }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 font-medium rounded-full',
      size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      variants[variant],
      className
    )}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
