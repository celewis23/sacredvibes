import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const size = Math.min(Math.max(parseInt(searchParams.get('size') ?? '512'), 32), 512)
  const fontSize = Math.round(size * 0.38)
  const letterSpacing = Math.round(size * -0.018)

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(145deg, #7B6E5D 0%, #C4A882 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: `${Math.round(size * 0.22)}px`,
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize,
            fontWeight: 700,
            letterSpacing,
            lineHeight: 1,
            fontFamily: 'serif',
          }}
        >
          SV
        </span>
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    }
  )
}
