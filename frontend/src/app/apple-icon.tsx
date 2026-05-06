import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
          borderRadius: '38px',
        }}
      >
        <span style={{ color: 'white', fontSize: 72, fontWeight: 700, fontFamily: 'serif', letterSpacing: '-3px' }}>
          SV
        </span>
      </div>
    ),
    { ...size }
  )
}
