'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useUIStore } from '@/stores/useUIStore'
import type { DisplayCurrency } from '@/lib/currency'
import { Globe, ChevronDown, Check } from 'lucide-react'

const CURRENCIES: { id: DisplayCurrency; label: string; symbol: string; flag: string; desc: string }[] = [
  { id: 'NATIVE', label: 'Native', symbol: '🌐', flag: '🌐', desc: 'Listing Exchange Currency' },
  { id: 'SGD', label: 'SGD', symbol: 'S$', flag: '🇸🇬', desc: 'Singapore Dollar' },
  { id: 'USD', label: 'USD', symbol: '$', flag: '🇺🇸', desc: 'US Dollar' },
  { id: 'IDR', label: 'IDR', symbol: 'Rp', flag: '🇮🇩', desc: 'Indonesian Rupiah' },
]

export function CurrencySwitcher() {
  const { displayCurrency, setDisplayCurrency } = useUIStore()
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
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium text-[#F0F4F8] bg-[#10141D] hover:bg-[#161D2B] border border-[#232B3A] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E599]"
      >
        <span className="text-xs">{current.flag}</span>
        <span className="font-semibold text-xs tracking-wider">{current.label}</span>
        <ChevronDown className={`h-3 w-3 text-[#6F7887] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Select display currency"
          className="absolute right-0 mt-1.5 w-48 rounded-lg bg-[#0D1117] border border-[#232B3A] shadow-xl z-50 p-1 font-mono text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2 py-1 text-[10px] uppercase text-[#6F7887] font-bold border-b border-[#1A2230] mb-1">
            Display Currency
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
                    ? 'bg-[#00E599]/15 text-[#00E599] font-bold'
                    : 'text-[#D0D6E0] hover:bg-[#161D2B] hover:text-[#F0F4F8]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{item.flag}</span>
                  <div>
                    <div className="font-semibold text-xs">{item.label}</div>
                    <div className="text-[10px] text-[#6F7887] font-sans">{item.desc}</div>
                  </div>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#00E599]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
