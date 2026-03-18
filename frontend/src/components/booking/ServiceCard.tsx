import Link from 'next/link'
import { clsx } from 'clsx'
import { Clock } from 'lucide-react'
import type { ServiceOffering } from '@/types'
import { formatPrice } from '@/lib/brand/resolution'
import Card from '@/components/ui/card'

interface Props {
  service: ServiceOffering
  colorScheme?: 'yoga' | 'hands' | 'sound'
}

export default function ServiceCard({ service, colorScheme = 'yoga' }: Props) {
  const accent = { yoga: 'text-yoga-600', hands: 'text-hands-600', sound: 'text-sound-600' }[colorScheme]

  return (
    <Card hover className="flex flex-col">
      <div className="flex-1">
        {service.category && (
          <p className={clsx('text-xs font-semibold tracking-widest uppercase mb-2', accent)}>
            {service.category}
          </p>
        )}
        <h3 className="font-heading text-xl text-sacred-900 mb-2 leading-snug">{service.name}</h3>
        {service.shortDescription && (
          <p className="text-sm text-sacred-600 leading-relaxed mb-4">{service.shortDescription}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-sacred-100">
        <div>
          <p className={clsx('font-semibold text-base', accent)}>
            {formatPrice(service.price, service.priceType, service.currency)}
          </p>
          {service.durationMinutes && (
            <p className="flex items-center gap-1 text-xs text-sacred-500 mt-0.5">
              <Clock size={12} />
              {service.durationMinutes} min
            </p>
          )}
        </div>
        {service.isBookable && (
          <Link
            href={`/booking?service=${service.id}`}
            className={clsx(
              'px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200',
              'bg-yoga-700 text-white hover:bg-yoga-800 shadow-sm'
            )}
          >
            Book
          </Link>
        )}
      </div>
    </Card>
  )
}
