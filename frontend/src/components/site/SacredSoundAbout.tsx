import Link from 'next/link'

export default function SacredSoundAbout() {
  return (
    <main>
      {/* Hero */}
      <section data-header="dark" className="section-dark pt-32 pb-28 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/sound-bath.jpg')", opacity: 0.2 }}
        />
        <div className="orb w-[700px] h-[700px] bg-sound-700"
             style={{ top: '-150px', right: '-150px', opacity: 0.14 }} />
        <div className="orb w-[500px] h-[500px] bg-sound-500"
             style={{ bottom: '-100px', left: '-100px', opacity: 0.08 }} />
        <div className="container-sacred relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-sound-300 mb-4">Sacred Sound</p>
          <h1 className="font-heading text-display-lg md:text-display-xl text-white mb-6 text-balance">
            Sound is the Original Medicine
          </h1>
          <span className="gold-line w-16 block mx-auto mb-8" />
          <p className="text-lg text-white/60 leading-relaxed tracking-wide">
            Long before words, there was vibration. Sacred Sound honors this ancient truth — using sound as a living technology to shift your nervous system, quiet the mind, and return you to your natural frequency.
          </p>
        </div>
      </section>

      {/* Philosophy */}
      <section className="section bg-white">
        <div className="container-sacred">
          <div className="grid md:grid-cols-2 gap-14 items-center max-w-5xl mx-auto">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-sound-500 mb-3">Our Philosophy</p>
              <h2 className="font-heading text-3xl text-sacred-900 mb-5">
                Vibration as a path to wholeness.
              </h2>
              <p className="text-sacred-600 leading-relaxed mb-4">
                Sound healing is not passive — it is participatory. The frequencies of singing bowls, gongs, and sacred instruments don't just wash over you; they communicate directly with your cells, your breath, your nervous system. You are both listener and instrument.
              </p>
              <p className="text-sacred-600 leading-relaxed">
                At Sacred Sound, we hold the space and the sound. All you need to do is receive. Each session is a guided return to the stillness that has always been inside you.
              </p>
            </div>

            <div className="space-y-5">
              {[
                { title: 'Vibrational Medicine', description: 'Sound frequencies entrain the brain toward relaxation, helping the body shift out of fight-or-flight and into deep rest.' },
                { title: 'Ancient Instruments', description: 'We work with Tibetan and crystal singing bowls, gongs, koshi chimes, ocean drums, and tuning forks — each chosen for its healing resonance.' },
                { title: 'Nervous System Reset', description: 'A sound bath guides your brainwaves from beta into alpha and theta — the same states reached in deep meditation.' },
                { title: 'Held in Safety', description: 'Every session is facilitated with care, intention, and the understanding that healing unfolds in its own time.' },
              ].map(value => (
                <div key={value.title} className="flex gap-4">
                  <div className="w-1 bg-sound-300 rounded-full shrink-0" />
                  <div>
                    <p className="font-semibold text-sacred-900 mb-0.5">{value.title}</p>
                    <p className="text-sm text-sacred-600">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Experience */}
      <section className="section bg-sound-950 text-white">
        <div className="container-sacred max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-medium uppercase tracking-widest text-sound-300 mb-3">The Experience</p>
            <h2 className="font-heading text-3xl">What Happens in a Sound Bath</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Settle In',
                description: 'You arrive, lay down, and let go of whatever you carried in. No effort is required. The only invitation is to be here.',
              },
              {
                step: '02',
                title: 'Receive the Sound',
                description: 'Layers of sound build and release around you — bowls, gongs, chimes weaving together. Your body responds naturally to the frequencies.',
              },
              {
                step: '03',
                title: 'Emerge Restored',
                description: 'The session closes in gentle silence. You re-enter the world softer, clearer, and more connected to yourself.',
              },
            ].map(step => (
              <div key={step.step} className="text-center">
                <p className="font-heading text-4xl text-sound-700 mb-3">{step.step}</p>
                <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-sound-200/70 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offerings Teaser */}
      <section className="section bg-sound-50">
        <div className="container-sacred max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-medium uppercase tracking-widest text-sound-500 mb-3">Experiences</p>
            <h2 className="font-heading text-3xl text-sacred-900">How We Gather</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Group Sound Baths',
                description: 'Community healing in a shared field of sound. Group sessions amplify the experience — there is power in healing together.',
                href: '/sound/events',
                cta: 'View Upcoming Events',
              },
              {
                title: 'Sound on the River',
                description: 'Our signature outdoor sound journey held in nature. Sound meets water, sky, and earth for a truly immersive healing experience.',
                href: '/sound/sound-on-the-river',
                cta: 'Learn More',
              },
            ].map(offering => (
              <div key={offering.title} className="bg-white rounded-2xl p-8 shadow-soft">
                <h3 className="font-heading text-xl text-sacred-900 mb-3">{offering.title}</h3>
                <p className="text-sacred-600 text-sm leading-relaxed mb-6">{offering.description}</p>
                <Link href={offering.href} className="text-sm font-medium text-sound-600 hover:text-sound-800 transition-colors">
                  {offering.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-sacred-900 text-white">
        <div className="container-sacred text-center max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl mb-4">Let the Sound Find You</h2>
          <p className="text-sacred-200 mb-8 leading-relaxed">
            Your nervous system is ready for this. Find an upcoming session and give yourself the gift of deep, vibrational rest.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/sound/events" className="px-8 py-3 bg-white text-sacred-900 rounded-full font-medium hover:bg-sacred-100 transition-colors">
              Upcoming Events
            </Link>
            <Link href="/sound/contact" className="px-8 py-3 border border-white/30 text-white rounded-full font-medium hover:bg-white/10 transition-colors">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
