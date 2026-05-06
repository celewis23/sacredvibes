import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(145deg, #7B6E5D 0%, #C4A882 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
        }}
      >
        <span style={{ color: 'white', fontSize: 14, fontWeight: 700, fontFamily: 'serif', letterSpacing: '-0.5px' }}>
          SV
        </span>
      </div>
    ),
    { ...size }
  )
}
