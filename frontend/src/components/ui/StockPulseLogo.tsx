import React from 'react'

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

export function StockPulseLogo({ size = 24, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Obsidian Vault Base with Hairline Frame */}
      <rect width="32" height="32" rx="7" fill="#07080A" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" stroke="#1D232C" strokeWidth="1" />
      
      {/* Subtle Grid Reference */}
      <line x1="6" y1="16" x2="26" y2="16" stroke="#141A24" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="16" y1="6" x2="16" y2="26" stroke="#141A24" strokeWidth="1" strokeDasharray="2 2" />

      {/* Dynamic Aperture Vector Wave */}
      <path
        d="M5 22L11 11L16 18L21 9L27 22"
        stroke="#00E599"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Cyan Precision Aperture Node */}
      <circle cx="21" cy="9" r="2.2" fill="#00B2FF" />
      <circle cx="21" cy="9" r="3.6" stroke="#00B2FF" strokeWidth="0.8" strokeOpacity="0.4" />

      {/* Amber Delta Catalyst Vertex */}
      <path
        d="M10 9L11 6.5L12 9"
        stroke="#FFB800"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
