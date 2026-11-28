'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useUIStore } from '@/stores/useUIStore'
import type { DisplayCurrency } from '@/lib/currency'
import { ChevronDown, Check } from 'lucide-react'
import { getTranslation } from '@/lib/i18n'

const CURRENCIES: { id: DisplayCurrency; label: string; symbol: string; desc: string; descId: string }[] = [
  { id: 'NATIVE', label: 'Native', symbol: 'NAT', desc: 'Listing Exchange Currency', descId: 'Mata Uang Asli Bursa' },
  { id: 'SGD', label: 'SGD', symbol: 'S$', desc: 'Singapore Dollar', descId: 'Dolar Singapura' },
  { id: 'USD', label: 'USD', symbol: '$', desc: 'US Dollar', descId: 'Dolar AS' },
  { id: 'IDR', label: 'IDR', symbol: 'Rp', desc: 'Indonesian Rupiah', descId: 'Rupiah Indonesia' },
]

export function CurrencySwitcher() {
  const { displayCurrency, setDisplayCurrency, language } = useUIStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const current = CURRENCIES.find((c) => c.id === displayCurrency) || CURRENCIES[0]

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Currency Selector: currently ${current.label}`}
        className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono font-medium text-[#e4e4e7] bg-[#141418] hover:bg-[#18181b] border border-[#222226] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
      >
        <span className="font-semibold tracking-wider">{current.label}</span>
        <ChevronDown className={`h-3 w-3 text-[#71717a] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Select display currency"
          className="absolute right-0 mt-1.5 w-48 rounded-md bg-[#0f0f12] border border-[#27272a] shadow-xl z-50 p-1 font-mono text-xs"
        >
          <div className="px-2 py-1 text-[10px] uppercase text-[#71717a] font-semibold border-b border-[#222226] mb-1">
            {getTranslation('displayCurrency', language)}
          </div>
          {CURRENCIES.map((item) => {
            const isSelected = item.id === displayCurrency
            return (
              <button
                key={item.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setDisplayCurrency(item.id)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors ${
                  isSelected
                    ? 'bg-[#f4f4f5] text-[#09090b] font-bold'
                    : 'text-[#d4d4d8] hover:bg-[#18181b] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] w-6 opacity-70">{item.symbol}</span>
                  <div>
                    <div className="font-semibold text-xs">{item.label}</div>
                    <div className={`text-[10px] font-sans ${isSelected ? 'text-zinc-600' : 'text-[#71717a]'}`}>
                      {language === 'id' ? item.descId : item.desc}
                    </div>
                  </div>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#09090b]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
