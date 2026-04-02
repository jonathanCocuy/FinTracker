import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'white', // El fondo blanco que quieres
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
        }}
      >
        {/* Usamos el componente real de Lucide */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="black"
          stroke="black" // O el color primary de tu app
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z" />
          <path d="M7 14h.01" />
          <path d="M9 5v2" />
          <path d="M15 5v2" />
        </svg>
      </div>
    ),
    { ...size }
  )
}