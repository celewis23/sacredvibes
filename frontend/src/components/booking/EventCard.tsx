import Link from 'next/link'
import { clsx } from 'clsx'
import { Calendar, MapPin, Users } from 'lucide-react'
import { format } from 'date-fns'
import type { EventOffering, BrandSlug } from '@/types'
import { formatPrice, toBrandPath } from '@/lib/brand/resolution'
import Card from '@/components/ui/card'
import Badge from '@/components/ui/badge'

interface Props {
  event: EventOffering
  colorScheme?: 'yoga' | 'hands' | 'sound'
  brandSlug?: BrandSlug
}

export default function EventCard({ event, colorScheme = 'yoga', brandSlug = 'sacred-vibes-yoga' }: Props) {
  const accent = { yoga: 'text-yoga-600', hands: 'text-hands-600', sound: 'text-sound-600' }[colorScheme]
  const startDate = new Date(event.startAt)
  const isSoldOut = event.isSoldOut

  return (
    <Card hover className="flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          {event.isSoundOnTheRiver && (
            <Badge variant="sound" className="mb-2">Sound on the River</Badge>
          )}
          {event.category && !event.isSoundOnTheRiver && (
            <p className={clsx('text-xs font-semibold tracking-widest uppercase mb-1', accent)}>
              {event.category}
            </p>
          )}
        </div>
        {isSoldOut && <Badge variant="danger">Sold Out</Badge>}
      </div>

      <h3 className="font-heading text-xl text-sacred-900 mb-3 leading-snug">{event.name}</h3>

      {event.shortDescription && (
        <p className="text-sm text-sacred-600 leading-relaxed mb-4 flex-1">{event.shortDescription}</p>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-sacred-500">
          <Calendar size={13} className="shrink-0" />
          <span>{format(startDate, 'EEEE, MMMM d')} · {format(startDate, 'h:mm a')}</span>
        </div>
        {(event.venue || event.city) && (
          <div className="flex items-center gap-2 text-xs text-sacred-500">
            <MapPin size={13} className="shrink-0" />
            <span>{[event.venue, event.city, event.state].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {event.capacity && (
          <div className="flex items-center gap-2 text-xs text-sacred-500">
            <Users size={13} className="shrink-0" />
            <span>
              {event.spotsRemaining != null
                ? `${event.spotsRemaining} spots remaining`
                : `${event.capacity} capacity`}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-sacred-100">
        <p className={clsx('font-semibold text-base', accent)}>
          {formatPrice(event.price, event.priceType, event.currency)}
        </p>
        {event.isBookable && !isSoldOut && (
          <Link
            href={toBrandPath(brandSlug, `/events/${event.slug}?register=1`)}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-yoga-700 text-white hover:bg-yoga-800 shadow-sm transition-all duration-200"
          >
            Register
          </Link>
        )}
      </div>
    </Card>
  )
}
