import { parseSections } from '@/lib/page-builder/helpers'
import type { Section } from '@/lib/page-builder/types'

const baseStyle = { bg: 'white', paddingY: 'none' } as const

const HANDS_HOME_SECTIONS: Section[] = [
  {
    id: 'hands-home-hero',
    type: 'hero',
    content: {
      eyebrow: 'Sacred Hands Massage Therapy',
      heading: 'Healing Through Touch',
      subheading: 'Transformative massage therapy designed to melt tension, restore balance, and return you to yourself. Our skilled therapists blend traditional techniques with intuitive healing touch.',
    },
    style: baseStyle,
  },
  {
    id: 'hands-home-services',
    type: 'heading',
    content: {
      eyebrow: 'Healing Modalities',
      heading: 'Our Massage Services',
      subheading: 'Every session is a sacred space — tailored to your body, your needs, and your intentions.',
    },
    style: baseStyle,
  },
  {
    id: 'hands-home-philosophy',
    type: 'heading',
    content: {
      eyebrow: 'Our Philosophy',
      heading: 'More Than Massage',
      subheading: 'Touch is one of our most fundamental human needs. When skilled hands meet an open body, something profound becomes possible — genuine healing at every level.',
      item1: 'Nervous system regulation through skilled therapeutic touch',
      item2: "Release of held tension patterns in the body's tissues",
      item3: 'Deep rest in a space free from expectation',
      item4: 'Integration of mind, body, and spirit',
      quote: '“The body is the first teacher. When we learn to listen to it, healing becomes possible in ways we never imagined.”',
      quoteAuthor: '— Sacred Hands Practitioner',
    },
    style: baseStyle,
  },
  {
    id: 'hands-home-blog',
    type: 'heading',
    content: {
      eyebrow: 'From the Practice',
      heading: 'Wellness Insights',
    },
    style: baseStyle,
  },
]

const SOUND_HOME_SECTIONS: Section[] = [
  {
    id: 'sound-home-hero',
    type: 'hero',
    content: {
      eyebrow: 'Sacred Sound Healing',
      heading: 'Vibrate Higher',
      subheading: 'A portal into vibrational healing through sound baths, singing bowls, gong immersions, and our signature Sound on the River experiences. Let the vibrations guide you inward.',
    },
    style: baseStyle,
  },
  {
    id: 'sound-home-services',
    type: 'heading',
    content: {
      eyebrow: 'Healing Sessions',
      heading: 'Sound Healing Offerings',
      subheading: 'From group sound baths to private sessions, find the vibrational medicine that calls to you.',
    },
    style: baseStyle,
  },
  {
    id: 'sound-home-river',
    type: 'heading',
    content: {
      eyebrow: 'Signature Program',
      heading: 'Sound on the River',
      body: 'Our most beloved offering: an outdoor sound healing ceremony held on the banks of the French Broad River. Surrounded by nature, the sounds of moving water, and the voices of crystal and Tibetan bowls, this experience is unlike anything else.',
    },
    style: baseStyle,
  },
  {
    id: 'sound-home-events',
    type: 'heading',
    content: {
      eyebrow: 'Calendar',
      heading: 'Upcoming Sound Events',
    },
    style: baseStyle,
  },
  {
    id: 'sound-home-blog',
    type: 'heading',
    content: {
      eyebrow: 'Learn',
      heading: 'Sound Healing Wisdom',
    },
    style: baseStyle,
  },
]

export function resolveHandsHomeSections(contentJson?: string | null) {
  return mergeSections(HANDS_HOME_SECTIONS, contentJson)
}

export function resolveSoundHomeSections(contentJson?: string | null) {
  return mergeSections(SOUND_HOME_SECTIONS, contentJson)
}

function mergeSections(defaultSections: Section[], contentJson?: string | null) {
  const parsed = parseSections(contentJson)
  if (parsed.length === 0) return defaultSections

  return defaultSections.map((defaultSection) => {
    const parsedSection = parsed.find((section) => section.id === defaultSection.id)
    if (!parsedSection) return defaultSection

    return {
      ...defaultSection,
      ...parsedSection,
      content: { ...defaultSection.content, ...parsedSection.content },
      style: { ...defaultSection.style, ...parsedSection.style },
    }
  })
}
