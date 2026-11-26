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
      {/* Minimalist Obsidian Frame */}
      <rect width="32" height="32" rx="6" fill="#09090b" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="5.5" stroke="#27272a" strokeWidth="1" />

      {/* Crisp Monochrome Pulse Wave */}
      <path
        d="M5 20L10.5 11.5L15.5 17.5L21 9.5L27 20"
        stroke="#f4f4f5"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
