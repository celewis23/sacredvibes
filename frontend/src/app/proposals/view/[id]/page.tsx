'use client'

import { use, useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { proposalsApi } from '@/lib/api'
import type { PublicProposal } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

type Status = 'loading' | 'ready' | 'unavailable'

function formatCurrency(amount: number) {
  return amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

function BannerBlock({ role, banner }: { role: 'header' | 'footer'; banner: PublicProposal['header'] }) {
  const defaultBg = role === 'header' ? '#5f5248' : '#faf9f7'
  const defaultTextColor = role === 'header' ? '#f3f0eb' : '#a49280'

  return (
    <div style={{ backgroundColor: banner.backgroundColor || defaultBg }}>
      {banner.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={banner.imageUrl} alt="" style={{ width: '100%', display: 'block' }} />
      )}
      {banner.text && (
        <div style={{ padding: role === 'header' ? '28px 32px' : '20px 32px', textAlign: 'center' }}>
          <p style={{ margin: 0, color: banner.textColor || defaultTextColor, fontSize: role === 'header' ? 18 : 13, whiteSpace: 'pre-wrap' }}>
            {banner.text}
          </p>
        </div>
      )}
    </div>
  )
}

export default function PublicProposalPage({ params }: Props) {
  const { id } = use(params)
  const [status, setStatus] = useState<Status>('loading')
  const [proposal, setProposal] = useState<PublicProposal | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    proposalsApi.getPublic(id)
      .then(res => {
        if (res.data.data) {
          setProposal(res.data.data)
          setStatus('ready')
        } else {
          setStatus('unavailable')
        }
      })
      .catch(() => setStatus('unavailable'))
  }, [id])

  // The stored body HTML represents video as an inert `<div data-proposal-video>` marker (see
  // proposalVideoNode.ts) so it stays portable across the PDF/email/online views. Only here —
  // where a real browser can actually play video — do we upgrade it into a live <video> tag.
  useEffect(() => {
    if (!bodyRef.current || !proposal) return
    const markers = bodyRef.current.querySelectorAll('[data-proposal-video]')
    markers.forEach(marker => {
      const src = marker.getAttribute('data-src')
      if (!src) return
      const poster = marker.getAttribute('data-poster')

      const video = document.createElement('video')
      video.controls = true
      video.src = src
      if (poster) video.poster = poster
      video.style.maxWidth = '100%'
      video.style.display = 'block'
      video.style.margin = '12px 0'
      video.style.borderRadius = '8px'

      marker.replaceWith(video)
    })
  }, [proposal])

  if (status === 'loading') {
    return (
      <main className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sacred-200 border-t-sacred-700 rounded-full animate-spin" />
      </main>
    )
  }

  if (status === 'unavailable' || !proposal) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center section">
        <div className="container-sacred max-w-md text-center">
          <h1 className="font-heading text-3xl text-sacred-900 mb-3">This proposal isn&apos;t available</h1>
          <p className="text-sacred-600">
            The link may have expired, or the proposal hasn&apos;t been sent yet. Please reach out to whoever shared this link with you.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f3f0eb] py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <BannerBlock role="header" banner={proposal.header} />

        <div className="px-8 py-8 text-[15px] leading-relaxed text-sacred-900">
          <div ref={bodyRef} dangerouslySetInnerHTML={{ __html: proposal.bodyContentHtml }} />

          {proposal.lineItems.length > 0 && (
            <table className="w-full mt-8 text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-sacred-100">
                  <th className="text-left py-2 text-xs uppercase tracking-wide text-sacred-400 font-semibold">Description</th>
                  <th className="text-right py-2 text-xs uppercase tracking-wide text-sacred-400 font-semibold">Price</th>
                </tr>
              </thead>
              <tbody>
                {proposal.lineItems.map(item => (
                  <tr key={item.id} className="border-b border-sacred-50">
                    <td className="py-2.5 text-sacred-900">{item.description}</td>
                    <td className="py-2.5 text-right text-sacred-900 whitespace-nowrap">{formatCurrency(item.price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-4 text-right font-medium text-sacred-700">Total</td>
                  <td className="pt-4 text-right font-bold text-lg text-sacred-900">{formatCurrency(proposal.total)}</td>
                </tr>
              </tfoot>
            </table>
          )}

          <div className="mt-8 text-center">
            <a
              href={proposalsApi.publicPdfUrl(id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-sacred-300 text-sacred-700 text-sm rounded-full hover:bg-sacred-50"
            >
              <Download size={15} /> Download PDF
            </a>
          </div>
        </div>

        <BannerBlock role="footer" banner={proposal.footer} />
      </div>
    </main>
  )
}
