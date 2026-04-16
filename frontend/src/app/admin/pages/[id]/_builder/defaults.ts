import type { Section, SectionType, SectionStyle } from './types'
import { uid } from './helpers'

// ── Section factory ───────────────────────────────────────────────────────────

export function makeSection(
  type: SectionType,
  contentOverrides?: Record<string, unknown>,
  styleOverrides?: Partial<SectionStyle>,
): Section {
  const defaults: Record<SectionType, { content: Record<string, unknown>; style: SectionStyle }> = {
    hero: {
      style: { bg: 'dark', paddingY: 'xl' },
      content: {
        eyebrow: '', headline: 'Your Headline Here',
        subheading: 'Supporting text that describes your offering.',
        ctaText: 'Book Now', ctaLink: '/booking',
        ctaSecondaryText: '', ctaSecondaryLink: '',
      },
    },
    heading: {
      style: { bg: 'white', paddingY: 'lg' },
      content: { eyebrow: 'Section Label', headline: 'Section Title', subheading: '', align: 'center' },
    },
    text: {
      style: { bg: 'white', paddingY: 'md' },
      content: { body: 'Add your text here. Share your story, describe your offerings, or provide details about your practice.' },
    },
    image: {
      style: { bg: 'white', paddingY: 'sm' },
      content: { src: '', alt: '', caption: '' },
    },
    'two-column': {
      style: { bg: 'white', paddingY: 'lg' },
      content: {
        leftHeadline: '', leftBody: 'Left column content goes here.',
        rightHeadline: '', rightBody: 'Right column content goes here.',
      },
    },
    services: {
      style: { bg: 'soft', paddingY: 'xl' },
      content: { eyebrow: 'What We Offer', headline: 'Our Services', subheading: '', maxItems: 6 },
    },
    events: {
      style: { bg: 'white', paddingY: 'xl' },
      content: { eyebrow: 'Join Us', headline: 'Upcoming Events', subheading: '', maxItems: 4, upcomingOnly: true },
    },
    gallery: {
      style: { bg: 'white', paddingY: 'lg' },
      content: { headline: '', columns: 3, maxItems: 12 },
    },
    cta: {
      style: { bg: 'dark', paddingY: 'xl' },
      content: {
        eyebrow: '', headline: "Ready to begin your journey?",
        subheading: 'Join our community of healers and seekers.',
        ctaText: 'Book Now', ctaLink: '/booking',
        ctaSecondaryText: '', ctaSecondaryLink: '',
      },
    },
    quote: {
      style: { bg: 'soft', paddingY: 'xl' },
      content: { text: 'Your inspiring quote goes here.', author: 'Name', source: '' },
    },
    divider: {
      style: { bg: 'white', paddingY: 'sm' },
      content: {},
    },
  }

  const d = defaults[type]
  return {
    id: uid(),
    type,
    content: { ...d.content, ...contentOverrides },
    style: { ...d.style, ...styleOverrides },
  }
}

// ── Page presets by slug ──────────────────────────────────────────────────────

export function pageDefaultSections(slug: string, template?: string | null): Section[] {
  switch (slug) {
    case 'about':
      return [
        makeSection('hero', {
          eyebrow: 'Our Story',
          headline: 'Born from a Love of Movement',
          subheading: 'Sacred Vibes Yoga was founded on the belief that yoga is for every body. Our studio is a sanctuary — a place to slow down, go inward, and reconnect with what matters most.',
          ctaText: '', ctaLink: '', ctaSecondaryText: '', ctaSecondaryLink: '',
        }, { paddingY: 'lg' }),
        makeSection('two-column', {
          leftHeadline: 'Our Mission',
          leftBody: 'To make yoga an accessible, transformative practice.\n\nWe believe that a consistent yoga practice has the power to transform not just your body, but your relationship with yourself and the world around you.',
          rightHeadline: 'Our Values',
          rightBody: 'Authenticity — We teach what we practice.\n\nInclusivity — All bodies. All backgrounds. All levels.\n\nCommunity — We build real relationships.\n\nIntegrity — Honesty and transparency in everything.',
        }),
        makeSection('cta', {
          headline: 'Ready to Begin?',
          subheading: 'Join us on the mat. Your first class is the hardest step — everything after that is the practice.',
          ctaText: 'Get in Touch', ctaLink: '/contact',
          ctaSecondaryText: 'View Schedule', ctaSecondaryLink: '/classes',
        }),
      ]

    case 'sound-on-the-river':
      return [
        makeSection('hero', {
          eyebrow: 'Sacred Sound Presents',
          headline: 'Sound on the River',
          subheading: 'An immersive outdoor sound healing experience where crystal bowls, Tibetan singing bowls, gongs, and the river itself become one.',
          ctaText: 'See Upcoming Dates', ctaLink: '#upcoming-events',
          ctaSecondaryText: '', ctaSecondaryLink: '',
        }),
        makeSection('two-column', {
          leftHeadline: 'Where Water Meets Vibration',
          leftBody: "Sound on the River is our signature outdoor event — a deeply immersive sound journey held at the water's edge at sunrise or twilight. The natural acoustic environment amplifies every tone, creating an experience unlike anything found in a studio.\n\nParticipants lie on comfortable mats surrounded by the instruments and the natural soundscape. There is nothing to do — only receive.",
          rightHeadline: 'Event Details',
          rightBody: 'Duration: 90 minutes\n\nSetting: Outdoor riverbank, weather permitting\n\nCapacity: Limited to 20 participants\n\nWhat to bring: Yoga mat, blanket, layers\n\nExperience required: None — open to all',
        }, { bg: 'dark' }),
        makeSection('events', { eyebrow: 'Upcoming Dates', headline: 'Sound on the River', maxItems: 6, upcomingOnly: true }),
        makeSection('quote', {
          text: 'I came in carrying the week in my shoulders. I left feeling like I had been rinsed clean by the river itself.',
          author: 'Sarah M.', source: 'Sound on the River attendee',
        }, { bg: 'dark' }),
      ]

    case 'contact':
      return [
        makeSection('heading', {
          eyebrow: '', headline: "Let's Connect",
          subheading: "Whether you have questions about classes, want to book a service, or simply want to say hello — we'd love to hear from you.",
        }, { bg: 'white', paddingY: 'lg' }),
        makeSection('text', {
          body: 'Yoga classes, workshops, and private sessions for all levels.\n\nEmail: info@sacredvibesyoga.com',
        }),
      ]

    case 'gallery':
      return [
        makeSection('hero', { headline: 'Gallery', subheading: 'Moments from our community.', ctaText: '', ctaLink: '' }, { paddingY: 'lg' }),
        makeSection('gallery', { headline: '', columns: 3, maxItems: 24 }),
      ]

    case 'booking':
      return [
        makeSection('hero', { headline: 'Book a Session', subheading: 'Choose your practice and schedule your next visit.', ctaText: '', ctaLink: '' }, { paddingY: 'lg' }),
        makeSection('services', { eyebrow: 'Available Services', headline: 'Choose Your Session', maxItems: 12 }),
      ]

    case 'services':
    case 'classes':
      return [
        makeSection('hero', { headline: 'Our Services', subheading: 'Yoga, massage, and sound healing — find the practice that calls to you.', ctaText: 'Book a Session', ctaLink: '/booking', ctaSecondaryText: '', ctaSecondaryLink: '' }, { paddingY: 'lg' }),
        makeSection('services', { eyebrow: 'What We Offer', headline: 'Sacred Offerings', subheading: '', maxItems: 12 }),
      ]

    case 'events':
      return [
        makeSection('hero', { headline: 'Upcoming Events', subheading: 'Join us for classes, workshops, and transformational experiences.', ctaText: '', ctaLink: '' }, { paddingY: 'lg' }),
        makeSection('events', { eyebrow: '', headline: 'All Upcoming Events', maxItems: 20, upcomingOnly: true }),
      ]

    default:
      switch (template) {
        case 'home':
          return [
            makeSection('hero', { headline: 'Move. Breathe. Heal. Thrive.', subheading: 'Sacred Vibes offers yoga, massage, and sound healing in a community built on transformation.', ctaText: 'Explore Our Offerings', ctaLink: '/services', ctaSecondaryText: 'Book a Session', ctaSecondaryLink: '/booking' }),
            makeSection('services', { eyebrow: 'What We Offer', headline: 'Sacred Offerings', subheading: 'Choose the practice that calls to you.', maxItems: 6 }),
            makeSection('events', { eyebrow: 'Join Us', headline: 'Upcoming Events', maxItems: 4, upcomingOnly: true }),
            makeSection('cta', { headline: 'Ready to begin your journey?', subheading: 'Your transformation starts with a single step.', ctaText: 'Book a Session', ctaLink: '/booking' }),
          ]
        default:
          return [
            makeSection('hero', { headline: 'Page Title', subheading: '', ctaText: '', ctaLink: '' }, { paddingY: 'lg' }),
            makeSection('text'),
          ]
      }
  }
}
