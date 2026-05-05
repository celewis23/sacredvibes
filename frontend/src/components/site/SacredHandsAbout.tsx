import Link from 'next/link'

export default function SacredHandsAbout() {
  return (
    <main>
      {/* Hero */}
      <section data-header="dark" className="section-dark pt-32 pb-28 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/sacred-hands.jpg')", opacity: 0.2 }}
        />
        <div className="orb w-[600px] h-[600px] bg-hands-700"
             style={{ top: '-120px', right: '-120px', opacity: 0.12 }} />
        <div className="orb w-[400px] h-[400px] bg-hands-500"
             style={{ bottom: '-80px', left: '-80px', opacity: 0.08 }} />
        <div className="container-sacred relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-hands-300 mb-4">Sacred Hands</p>
          <h1 className="font-heading text-display-lg md:text-display-xl text-white mb-6 text-balance">
            Healing is a Sacred Act
          </h1>
          <span className="gold-line w-16 block mx-auto mb-8" />
          <p className="text-lg text-white/60 leading-relaxed tracking-wide">
            Sacred Hands is rooted in the belief that touch is one of the oldest and most powerful forms of medicine. Every session is a conversation between practitioner and body — a space where tension releases, energy flows, and restoration begins.
          </p>
        </div>
      </section>

      {/* Philosophy */}
      <section className="section bg-white">
        <div className="container-sacred">
          <div className="grid md:grid-cols-2 gap-14 items-center max-w-5xl mx-auto">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-hands-500 mb-3">Our Philosophy</p>
              <h2 className="font-heading text-3xl text-sacred-900 mb-5">
                Bodywork as a spiritual practice.
              </h2>
              <p className="text-sacred-600 leading-relaxed mb-4">
                We don't separate the body from the spirit. At Sacred Hands, massage therapy is not just physical maintenance — it is a pathway to presence. Our practitioners approach every session with intention, reverence, and deep listening.
              </p>
              <p className="text-sacred-600 leading-relaxed">
                Whether you're carrying chronic tension, recovering from stress, or simply craving a moment of genuine stillness, Sacred Hands creates the container for your body to do what it already knows how to do — heal.
              </p>
            </div>

            <div className="space-y-5">
              {[
                { title: 'Intentional Touch', description: 'Every technique is applied with purpose. We meet your body where it is, not where we think it should be.' },
                { title: 'Intuitive Listening', description: 'Our practitioners are trained to read what the body communicates beneath the surface.' },
                { title: 'Nervous System First', description: 'We work to regulate, not override. Safety and surrender are the foundation of every session.' },
                { title: 'Whole-Person Care', description: 'Physical tension is rarely just physical. We hold space for the full complexity of your experience.' },
              ].map(value => (
                <div key={value.title} className="flex gap-4">
                  <div className="w-1 bg-hands-300 rounded-full shrink-0" />
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

      {/* What to Expect */}
      <section className="section bg-hands-50">
        <div className="container-sacred max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-medium uppercase tracking-widest text-hands-500 mb-3">Your Session</p>
            <h2 className="font-heading text-3xl text-sacred-900">What to Expect</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Arrive & Settle',
                description: 'We begin with a brief check-in to understand your intentions, areas of focus, and any sensitivities. There is no rush. This time belongs to you.',
              },
              {
                step: '02',
                title: 'The Session',
                description: 'Your practitioner tailors pressure, rhythm, and technique to your body\'s needs in the moment. Expect a blend of Swedish, deep tissue, and intuitive energy work.',
              },
              {
                step: '03',
                title: 'Integration',
                description: 'We close with a moment of stillness to let the work settle. You\'ll leave with grounded clarity and a body that remembers what rest feels like.',
              },
            ].map(step => (
              <div key={step.step} className="text-center">
                <p className="font-heading text-4xl text-hands-200 mb-3">{step.step}</p>
                <h3 className="font-semibold text-sacred-900 mb-2">{step.title}</h3>
                <p className="text-sm text-sacred-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-hands-900 text-white">
        <div className="container-sacred text-center max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl mb-4">Ready to Restore?</h2>
          <p className="text-hands-200 mb-8 leading-relaxed">
            Your body has been waiting for this. Book a session and step into the sacred space of healing touch.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/hands/booking" className="px-8 py-3 bg-white text-hands-900 rounded-full font-medium hover:bg-hands-100 transition-colors">
              Book a Session
            </Link>
            <Link href="/hands/services" className="px-8 py-3 border border-white/30 text-white rounded-full font-medium hover:bg-white/10 transition-colors">
              View Services
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
