'use client'

import { useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'

const EXPERIENCES = [
  {
    id: 'relax',
    icon: '🌊',
    title: 'Relax & Release',
    subtitle: 'Let it all go',
    description: 'Deep rest for your nervous system. Sound baths, gentle yoga nidra, and therapeutic massage that melt tension and return you to stillness.',
    href: '/classes',
    tags: ['Sound Bath', 'Yin Yoga', 'Therapeutic Massage'],
  },
  {
    id: 'heal',
    icon: '✦',
    title: 'Heal & Restore',
    subtitle: 'Return to wholeness',
    description: 'Targeted energy work, private sound healing, and restorative sessions designed to support deep cellular healing and inner alignment.',
    href: '/booking',
    tags: ['Private Sound Healing', 'Energy Work', 'Craniosacral'],
  },
  {
    id: 'elevate',
    icon: '◈',
    title: 'Elevate Your Energy',
    subtitle: 'Rise higher',
    description: 'Breathwork, vibrational ceremonies, and immersive sound journeys that clear stagnant energy and raise your frequency to new heights.',
    href: '/events',
    tags: ['Sound Journey', 'Breathwork', 'Gong Immersion'],
  },
  {
    id: 'move',
    icon: '❋',
    title: 'Move Your Body',
    subtitle: 'Feel alive',
    description: 'Dynamic yoga flows, alignment-focused vinyasa, and movement practices that strengthen, lengthen, and reconnect you to the intelligence of your body.',
    href: '/classes',
    tags: ['Vinyasa Flow', 'Power Yoga', 'Alignment Class'],
  },
]

export default function ExperienceSelector() {
  const [active, setActive] = useState<string | null>(null)

  const selected = EXPERIENCES.find(e => e.id === active)

  return (
    <section className="section section-dark relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="orb w-[400px] h-[400px] bg-yoga-700"
           style={{ top: '-80px', right: '-80px', opacity: 0.08 }} />
      <div className="orb w-[300px] h-[300px] bg-sage-700"
           style={{ bottom: '-60px', left: '-60px', opacity: 0.06 }} />

      <div className="container-sacred relative z-10">
        {/* Heading */}
        <div className="text-center mb-16">
          <p className="eyebrow text-yoga-400 mb-4">Your Practice Awaits</p>
          <h2 className="font-heading text-display-lg md:text-display-xl text-white leading-tight mb-5 text-balance">
            What do you need today?
          </h2>
          <p className="text-white/50 text-base font-body font-light max-w-lg mx-auto tracking-wide">
            Every session is an invitation to arrive exactly as you are.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {EXPERIENCES.map((exp) => {
            const isActive = active === exp.id
            return (
              <button
                key={exp.id}
                onClick={() => setActive(isActive ? null : exp.id)}
                className={clsx(
                  'group relative text-left p-7 rounded-3xl border transition-all duration-500 cursor-pointer',
                  isActive
                    ? 'bg-gradient-to-br from-yoga-700/30 to-yoga-900/20 border-yoga-500/50 shadow-glow scale-[1.02]'
                    : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20 hover:scale-[1.01]'
                )}
              >
                <div className={clsx(
                  'text-3xl mb-5 transition-transform duration-300',
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                )}>
                  {exp.icon}
                </div>
                <p className={clsx(
                  'font-heading text-xl mb-1 leading-snug transition-colors duration-300',
                  isActive ? 'text-yoga-300' : 'text-white'
                )}>
                  {exp.title}
                </p>
                <p className={clsx(
                  'text-xs font-body tracking-wider uppercase transition-colors duration-300',
                  isActive ? 'text-yoga-400' : 'text-white/40'
                )}>
                  {exp.subtitle}
                </p>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-yoga-400 animate-glow-pulse" />
                )}
              </button>
            )
          })}
        </div>

        {/* Expanded content */}
        {selected && (
          <div className="max-w-2xl mx-auto text-center animate-fade-in">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-white/80 font-body font-light text-lg leading-relaxed mb-6 tracking-wide">
                {selected.description}
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {selected.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-1.5 rounded-full text-xs font-body font-medium tracking-wider uppercase bg-yoga-700/30 text-yoga-300 border border-yoga-600/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={selected.href} className="btn-gold inline-flex">
                Explore {selected.title}
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
