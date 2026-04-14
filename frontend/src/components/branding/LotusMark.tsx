import { clsx } from 'clsx'

interface LotusMarkProps {
  className?: string
  gradientClassName?: string
}

export default function LotusMark({ className, gradientClassName }: LotusMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={clsx('relative inline-block aspect-[492/330] shrink-0', className)}
    >
      <span
        className={clsx(
          'block h-full w-full bg-gradient-to-br from-yoga-500 via-yoga-600 to-yoga-800',
          gradientClassName
        )}
        style={{
          WebkitMaskImage: "url('/images/lotus-icon.png')",
          maskImage: "url('/images/lotus-icon.png')",
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
        }}
      />
    </span>
  )
}
