import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#09090b',
          width: '512px',
          height: '512px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '110px',
        }}
      >
        <svg width="300" height="300" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z" />
          <path d="M2 9v1a2 2 0 0 0 2 2h1" />
          <path d="M7 14h.01" />
          <path d="M9 5v2" />
          <path d="M15 5v2" />
        </svg>
      </div>
    ),
    { width: 512, height: 512 }
  )
}
