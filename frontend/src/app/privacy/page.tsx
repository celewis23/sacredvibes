import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy - Sacred Vibes',
  description:
    'Learn how Sacred Vibes Healing & Wellness collects, uses, and protects information for classes, bookings, events, memberships, digital studio content, and communications.',
}

const policySections = [
  {
    title: 'Information We Collect',
    body: [
      'We collect information you choose to share with us, including your name, email address, phone number, booking details, class or service interests, account information, contact form messages, newsletter preferences, and any details you provide when registering for events, services, or digital studio access.',
      'When you make a purchase, book a class, reserve a service, register for an event, or subscribe to an offering, payment and transaction information may be processed by our payment and booking partners. Sacred Vibes does not intentionally store full payment card numbers on this website.',
      'We may also collect basic technical information such as device type, browser, pages visited, referring links, and general usage data to help us keep the website reliable, secure, and useful.',
    ],
  },
  {
    title: 'How We Use Information',
    body: [
      'We use your information to provide and manage our offerings, including yoga classes, therapeutic massage and bodywork, sound healing experiences, workshops, private sessions, corporate wellness programs, digital studio content, subscriptions, event registrations, customer support, and follow-up communications.',
      'We may also use your information to send confirmations, reminders, receipts, service updates, newsletters, promotional messages you have opted into, waitlist updates, and responses to your questions or requests.',
      'Operationally, we use information to improve our website, organize bookings, manage accounts, protect against misuse, maintain business records, and understand which offerings are serving the community.',
    ],
  },
  {
    title: 'Wellness and Booking Notes',
    body: [
      'Some wellness services may invite you to share preferences, goals, accessibility needs, or relevant health context so we can prepare an appropriate experience. Please share only what you are comfortable sharing and what you believe is relevant to your participation.',
      'Sacred Vibes is a wellness provider, not an emergency or clinical medical provider. Do not submit urgent medical information through website forms, email, booking notes, or account messages.',
    ],
  },
  {
    title: 'Cookies and Similar Technologies',
    body: [
      'Our website may use cookies, local storage, analytics tools, and similar technologies to remember preferences, support login sessions, improve performance, understand site usage, and keep the experience working across devices.',
      'You can adjust cookie settings through your browser. Blocking some cookies may affect account access, booking flows, payment flows, or other website features.',
    ],
  },
  {
    title: 'Service Providers',
    body: [
      'We work with trusted providers that help us operate the website and deliver services. These may include hosting providers, email services, payment processors, booking systems, analytics tools, event platforms, customer management tools, and content storage services.',
      'These providers are allowed to use information only as needed to perform services for Sacred Vibes or as otherwise permitted by their own terms and privacy policies.',
    ],
  },
  {
    title: 'How We Share Information',
    body: [
      'We do not sell your personal information. We may share information with service providers that help us operate the business, process payments, manage bookings, deliver digital content, communicate with you, and maintain the website.',
      'We may also share information when required by law, to protect our rights or safety, to prevent fraud or misuse, or as part of a business transition such as a merger, reorganization, or transfer of assets.',
    ],
  },
  {
    title: 'Email and Marketing Choices',
    body: [
      'If you subscribe to our newsletter or request updates, we may send you emails about classes, events, workshops, memberships, wellness offerings, and Sacred Vibes news.',
      'You can unsubscribe from marketing emails using the unsubscribe link in those emails or by contacting us. We may still send transactional or service-related messages, such as booking confirmations, receipts, account notices, or important updates about a service you requested.',
    ],
  },
  {
    title: 'Data Retention and Security',
    body: [
      'We keep personal information for as long as reasonably needed to provide services, maintain records, resolve disputes, meet legal or accounting obligations, and support legitimate business operations.',
      'We use reasonable administrative, technical, and organizational safeguards to protect information. No website, email system, or online service can guarantee absolute security, so please use care when sharing sensitive information online.',
    ],
  },
  {
    title: 'Your Choices',
    body: [
      'You may contact us to request access to, correction of, or deletion of personal information associated with you, subject to legal, security, and operational requirements.',
      'You may also ask us to update your communication preferences, remove you from marketing lists, or answer questions about how your information is used.',
    ],
  },
  {
    title: 'Children',
    body: [
      'This website is not directed to children under 13. We do not knowingly collect personal information from children under 13 through this website. If you believe a child has provided personal information to us, please contact us so we can review and take appropriate action.',
    ],
  },
  {
    title: 'Policy Updates',
    body: [
      'We may update this Privacy Policy as our website, services, tools, or legal requirements change. The updated version will be posted on this page with a revised effective date.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <main>
      <section data-header="dark" className="section-dark pt-32 pb-24 relative overflow-hidden">
        <div className="orb w-[620px] h-[620px] bg-yoga-700" style={{ top: '-180px', right: '-130px', opacity: 0.1 }} />
        <div className="orb w-[440px] h-[440px] bg-sage-700" style={{ bottom: '-130px', left: '-90px', opacity: 0.08 }} />

        <div className="container-sacred relative z-10 max-w-4xl mx-auto text-center">
          <p className="eyebrow text-yoga-300 mb-4">Privacy Policy</p>
          <h1 className="font-heading text-display-lg md:text-display-xl text-white mb-6 text-balance">
            Your privacy matters to the Sacred Vibes community.
          </h1>
          <span className="gold-line w-16 block mx-auto mb-8" />
          <p className="text-lg text-white/65 leading-relaxed tracking-wide max-w-3xl mx-auto">
            This policy explains how Sacred Vibes Healing &amp; Wellness collects, uses, shares, and protects information when you visit our website, book offerings, join events, subscribe, or contact us.
          </p>
        </div>
      </section>

      <section className="section bg-sacred-50">
        <div className="container-sacred max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-[260px_1fr] gap-10 lg:gap-16">
            <aside className="lg:sticky lg:top-28 self-start">
              <div className="border-l border-yoga-300 pl-5">
                <p className="eyebrow text-sacred-400 mb-3">Effective Date</p>
                <p className="font-heading text-2xl text-sacred-900 mb-4">May 6, 2026</p>
                <p className="text-sm text-sacred-600 leading-relaxed">
                  Questions about privacy or your information can be sent to{' '}
                  <a href="mailto:hello@sacredvibesyoga.com" className="text-yoga-700 underline underline-offset-2 hover:text-yoga-800">
                    hello@sacredvibesyoga.com
                  </a>
                  .
                </p>
              </div>
            </aside>

            <div className="bg-white border border-sacred-100 rounded-2xl shadow-soft p-6 sm:p-8 lg:p-10">
              <div className="prose-sacred max-w-none">
                <p>
                  Sacred Vibes Healing &amp; Wellness, including our yoga, sound healing, massage and bodywork, events, private sessions, corporate wellness, and digital studio offerings, respects your privacy. We aim to collect only what we need to serve you well and operate responsibly.
                </p>

                {policySections.map((section) => (
                  <section key={section.title} aria-labelledby={section.title.toLowerCase().replaceAll(' ', '-')}>
                    <h2 id={section.title.toLowerCase().replaceAll(' ', '-')}>{section.title}</h2>
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </section>
                ))}

                <section aria-labelledby="contact-us">
                  <h2 id="contact-us">Contact Us</h2>
                  <p>
                    For privacy questions, requests, or concerns, contact Sacred Vibes Healing &amp; Wellness at{' '}
                    <a href="mailto:hello@sacredvibesyoga.com">hello@sacredvibesyoga.com</a>.
                  </p>
                  <p>
                    You can also reach us through the{' '}
                    <Link href="/contact">contact page</Link>
                    .
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
