import Link from 'next/link'
import type { Metadata } from 'next'
import LotusMark from '@/components/branding/LotusMark'
import NewsletterSection from '@/components/sections/NewsletterSection'
import { getBrandIdBySlug } from '@/lib/brand/resolution'

export const metadata: Metadata = {
  title: 'Corporate Wellness',
  description: 'Sacred Vibes brings ancient healing practices into modern workplaces — helping teams regulate, reconnect, and elevate their collective energy through yoga, sound healing, and breathwork.',
}

const OFFERINGS = [
  {
    eyebrow: 'Movement',
    icon: '🧘',
    title: 'On-Site Yoga & Movement',
    description: 'Intentional movement sessions that release stored tension, restore presence, and reconnect your team to their bodies. Designed for all levels — from the boardroom to the breakout room.',
  },
  {
    eyebrow: 'Sound Healing',
    icon: '🎵',
    title: 'Group Sound Bath',
    description: 'A full nervous-system reset using crystal singing bowls, gongs, and sacred instruments. Employees leave feeling deeply rested, clear-headed, and genuinely restored — not just relaxed.',
  },
  {
    eyebrow: 'Breathwork',
    icon: '🌬️',
    title: 'Breathwork & Regulation',
    description: 'Evidence-based breath practices that shift your team out of chronic stress and back into clarity, focus, and creative capacity. Tools they can carry into every meeting and deadline.',
  },
  {
    eyebrow: 'Custom Activation',
    icon: '✦',
    title: 'Sacred Wellness Activation',
    description: 'A fully bespoke experience designed around your people, your culture, and your goals — blending movement, sound, breathwork, and energy work into one seamless, unforgettable event.',
  },
]

const FITS = [
  { label: 'Employee wellness days & benefit programs' },
  { label: 'Leadership retreats and executive offsites' },
  { label: 'Conference breakout & reset sessions' },
  { label: 'Client & community appreciation events' },
  { label: 'Virtual sessions for distributed teams' },
  { label: 'Private corporate retreats & annual activations' },
]

const FORMATS = [
  { label: 'In-Person',        value: 'Richmond-based — available to travel nationally & internationally' },
  { label: 'Virtual',          value: 'Live guided sessions for distributed and remote teams' },
  { label: 'Single Session',   value: 'A powerful one-time experience for meetings or milestone events' },
  { label: 'Ongoing Program',  value: 'Recurring weekly, monthly, or seasonal wellness partnerships' },
]

const PROCESS = [
  {
    step: '01',
    title: 'Discovery Conversation',
    description: "We start with a real conversation about your team's needs, culture, and what you're hoping to shift — whether that's burnout, disconnection, or simply a desire to offer something meaningful.",
  },
  {
    step: '02',
    title: 'Custom Experience Design',
    description: "Shanna curates a session or program specifically for your group — selecting the right modalities, pacing, and intention to create an experience that actually lands.",
  },
  {
    step: '03',
    title: 'Arrive & Transform',
    description: 'We handle everything. You and your team simply show up, drop in, and leave feeling the difference. Most participants describe it as the best professional development they have ever experienced.',
  },
]

const TESTIMONIALS = [
  {
    quote: "Our team had been running on empty for months. Shanna's sound bath brought us back to ourselves in a way no team-building exercise ever has. People were still talking about it weeks later.",
    name: 'Director of People & Culture',
    company: 'Tech Company, Richmond VA',
  },
  {
    quote: "We hired Sacred Vibes for our annual leadership retreat. It completely changed the tone of the entire event — more presence, more openness, more real conversation. We're booking again for next year.",
    name: 'VP of Operations',
    company: 'Healthcare Organization',
  },
]

const STATS = [
  { value: '200+', label: 'Corporate sessions led' },
  { value: '50+',  label: 'Organizations served' },
  { value: '100%', label: 'Custom — no two are the same' },
  { value: '5★',   label: 'Average client rating' },
]

export default function CorporateWellnessPage() {
  const brandId = getBrandIdBySlug('sacred-vibes-yoga')

  return (
    <main className="bg-white">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section data-header="dark" className="relative overflow-hidden section-dark pt-32 pb-28">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/corporate-wellness.jpg')", opacity: 0.22 }}
        />
        <div className="orb w-[700px] h-[700px] bg-yoga-700"
             style={{ top: '-150px', right: '-150px', opacity: 0.1 }} />
        <div className="orb w-[500px] h-[500px] bg-sage-700"
             style={{ bottom: '-100px', left: '-100px', opacity: 0.07 }} />

        <div className="container-sacred relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-yoga-700/30 border border-yoga-500/30 flex items-center justify-center text-3xl mx-auto mb-8 animate-float">
              <LotusMark className="w-10" />
            </div>
            <p className="eyebrow text-yoga-400 mb-5">Corporate Wellness</p>
            <h1 className="font-heading text-display-lg md:text-display-xl text-white leading-tight mb-6 text-balance">
              Elevate Your Team's<br/>Energy & Wellbeing
            </h1>
            <span className="gold-line w-16 block mx-auto mb-8" />
            <p className="text-white/65 text-lg font-body font-light leading-relaxed tracking-wide mb-12 max-w-2xl mx-auto">
              Sacred Vibes brings ancient healing practices into modern workplaces — helping teams
              regulate their nervous systems, reconnect to themselves, and show up with more
              clarity, presence, and energy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-gold">Request a Proposal</Link>
              <Link href="/contact" className="btn-ghost-light">Book a Discovery Call</Link>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-20 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center p-6 rounded-3xl bg-white/5 border border-white/10">
                <p className="font-heading text-3xl text-yoga-400 mb-1">{s.value}</p>
                <p className="text-white/45 text-xs font-body tracking-wide leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Problem ────────────────────────────────────────────────── */}
      <section className="section section-sand relative overflow-hidden">
        <div className="orb w-[500px] h-[500px] bg-yoga-200"
             style={{ top: '-80px', right: '-80px', opacity: 0.5 }} />
        <div className="container-sacred relative z-10">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="eyebrow text-yoga-600 mb-5">Why It Matters</p>
              <h2 className="font-heading text-display-md text-sacred-900 leading-tight mb-5 text-balance">
                Your People Are Carrying More Than Their Workload
              </h2>
              <span className="gold-line w-12 block mb-7" />
              <div className="space-y-5 text-sacred-500 font-body font-light leading-relaxed tracking-wide">
                <p>
                  Chronic stress, constant connectivity, and the pressure to perform at a relentless
                  pace has left most teams operating from a state of dysregulation — not laziness,
                  not lack of motivation, but a nervous system that never gets to fully rest.
                </p>
                <p>
                  The result shows up as burnout, presenteeism, fractured communication, and a
                  quiet disconnection that no amount of coffee-and-pizza Fridays can fix.
                </p>
                <p className="text-sacred-700 font-normal">
                  Sacred Vibes offers something different — experiences rooted in ancient wisdom
                  and modern science that actually help people reset at the level of the body,
                  not just the mind.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { stat: '83%',  text: 'of employees report work-related stress affecting their performance' },
                { stat: '77%',  text: 'say they have experienced burnout at their current job' },
                { stat: '3×',   text: 'more likely to stay when employers invest in meaningful wellbeing' },
                { stat: '↑40%', text: 'increase in focus and creativity after a single sound healing session' },
              ].map((item) => (
                <div key={item.stat} className="flex items-start gap-5 p-6 bg-white rounded-2xl border border-sacred-100 shadow-soft">
                  <span className="font-heading text-2xl text-yoga-600 shrink-0 leading-none pt-0.5">
                    {item.stat}
                  </span>
                  <p className="text-sm text-sacred-600 font-body font-light leading-relaxed tracking-wide">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Offerings ──────────────────────────────────────────────────── */}
      <section className="section bg-white relative overflow-hidden">
        <div className="orb w-[400px] h-[400px] bg-yoga-100"
             style={{ bottom: '-60px', left: '-60px', opacity: 0.6 }} />
        <div className="container-sacred relative z-10">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="eyebrow text-yoga-600 mb-4">What We Offer</p>
            <h2 className="font-heading text-display-md text-sacred-900 leading-tight mb-4 text-balance">
              Experiences Tailored to Your People
            </h2>
            <span className="gold-line w-14 block mx-auto mb-5" />
            <p className="text-sacred-500 font-body font-light leading-relaxed tracking-wide">
              Every offering is designed to meet your team exactly where they are — and guide them somewhere they haven't been in a while.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {OFFERINGS.map((item) => (
              <div key={item.title} className="experience-card group p-8">
                <div className="text-3xl mb-5">{item.icon}</div>
                <p className="eyebrow text-yoga-500 mb-2">{item.eyebrow}</p>
                <h3 className="font-heading text-2xl text-sacred-900 mb-3 leading-snug">{item.title}</h3>
                <p className="text-sacred-500 font-body font-light leading-relaxed tracking-wide">
                  {item.description}
                </p>
                <div className="shimmer-overlay rounded-3xl" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section className="section section-sand relative overflow-hidden">
        <div className="orb w-[500px] h-[500px] bg-yoga-200"
             style={{ top: '-80px', right: '-60px', opacity: 0.4 }} />
        <div className="container-sacred relative z-10">
          <div className="text-center mb-16">
            <p className="eyebrow text-yoga-600 mb-4">The Process</p>
            <h2 className="font-heading text-display-md text-sacred-900 leading-tight mb-4 text-balance">
              Simple. Sacred. Seamless.
            </h2>
            <span className="gold-line w-14 block mx-auto" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PROCESS.map((step, i) => (
              <div key={step.step} className="relative">
                {/* Connector line */}
                {i < PROCESS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%_-_1rem)] w-8 h-px bg-gradient-to-r from-yoga-300 to-yoga-200 z-10" />
                )}
                <div className="p-8 rounded-3xl bg-white border border-sacred-100 shadow-soft h-full">
                  <p className="font-heading text-4xl text-yoga-200 leading-none mb-5">{step.step}</p>
                  <h3 className="font-heading text-xl text-sacred-900 mb-3 leading-snug">{step.title}</h3>
                  <p className="text-sm text-sacred-500 font-body font-light leading-relaxed tracking-wide">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Best For + Formats ─────────────────────────────────────────── */}
      <section className="section bg-white">
        <div className="container-sacred max-w-5xl mx-auto grid gap-12 lg:grid-cols-2 items-start">

          <div>
            <p className="eyebrow text-yoga-600 mb-4">Best For</p>
            <h2 className="font-heading text-display-md text-sacred-900 mb-5 leading-tight text-balance">
              Built for Teams Who Want Something Real
            </h2>
            <span className="gold-line w-12 block mb-7" />
            <p className="text-sacred-500 font-body font-light leading-relaxed tracking-wide mb-8">
              Whether you want a restorative employee benefit, a standout retreat moment, or a
              grounded experience for your clients and community — we design the session around
              what your group actually needs to feel the shift.
            </p>
            <div className="space-y-3">
              {FITS.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <LotusMark className="w-5 shrink-0" />
                  <p className="text-sm text-sacred-600 font-body tracking-wide">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] p-8 bg-gradient-to-br from-sacred-50 to-yoga-50 border border-yoga-100">
            <p className="eyebrow text-yoga-600 mb-4">How We Work</p>
            <h3 className="font-heading text-2xl text-sacred-900 mb-6">Flexible by Design</h3>
            <div className="space-y-5">
              {FORMATS.map((item) => (
                <div key={item.label} className="pb-5 border-b border-yoga-100 last:border-0 last:pb-0">
                  <p className="font-body font-semibold text-sacred-900 text-sm mb-1 tracking-wide">
                    {item.label}
                  </p>
                  <p className="text-sm text-sacred-500 font-body font-light leading-relaxed tracking-wide">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-yoga-100">
              <p className="text-xs text-sacred-400 font-body tracking-wide leading-relaxed">
                All programs are fully customizable. Pricing is based on group size, format,
                and scope. We'll build a proposal together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────── */}
      <section className="section section-sand relative overflow-hidden">
        <div className="orb w-[400px] h-[400px] bg-yoga-200"
             style={{ top: '-60px', right: '-60px', opacity: 0.45 }} />
        <div className="container-sacred relative z-10">
          <div className="text-center mb-14">
            <p className="eyebrow text-yoga-600 mb-4">Client Experiences</p>
            <h2 className="font-heading text-display-md text-sacred-900 mb-4 text-balance">
              What Teams Are Saying
            </h2>
            <span className="gold-line w-14 block mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card group">
                <div className="font-heading text-6xl text-yoga-200 leading-none mb-4 group-hover:text-yoga-300 transition-colors duration-300">
                  &ldquo;
                </div>
                <p className="text-sacred-700 font-body font-light text-base leading-relaxed mb-6 tracking-wide italic">
                  {t.quote}
                </p>
                <div className="flex items-center gap-3 pt-5 border-t border-sacred-100">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yoga-300 to-yoga-500 flex items-center justify-center flex-shrink-0">
                    <LotusMark className="w-5" />
                  </div>
                  <div>
                    <p className="font-body font-medium text-sacred-900 text-sm">{t.name}</p>
                    <p className="text-sacred-400 text-xs font-body tracking-wide">{t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section data-header="dark" className="section-dark py-28 relative overflow-hidden">
        <div className="orb w-[600px] h-[600px] bg-yoga-700"
             style={{ top: '-120px', left: '50%', transform: 'translateX(-50%)', opacity: 0.09 }} />
        <div className="container-sacred relative z-10 text-center max-w-3xl mx-auto">
          <LotusMark className="w-14 mx-auto mb-8" />
          <p className="eyebrow text-yoga-400 mb-5">Let&apos;s Build Something Sacred</p>
          <h2 className="font-heading text-display-md md:text-display-lg text-white mb-5 text-balance">
            Your team deserves to feel<br className="hidden md:block" /> as good as the work they do.
          </h2>
          <span className="gold-line w-16 block mx-auto mb-8" />
          <p className="text-white/55 font-body font-light text-lg mb-12 leading-relaxed tracking-wide">
            Tell us about your team, your event, or your vision. We&apos;ll shape an experience
            that feels aligned, intentional, and genuinely transformational.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="btn-gold">Request a Proposal</Link>
            <Link href="/events"  className="btn-ghost-light">View Public Offerings</Link>
          </div>
        </div>
      </section>

      {/* ── Newsletter ─────────────────────────────────────────────────── */}
      <NewsletterSection brandId={brandId} />

    </main>
  )
}
