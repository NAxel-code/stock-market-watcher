'use client'

import React from 'react'
import { useUIStore } from '@/stores/useUIStore'
import type { Language } from '@/lib/i18n'

export function LanguageSwitcher() {
  const { language, setLanguage } = useUIStore()

  const toggleLanguage = (lang: Language) => {
    setLanguage(lang)
  }

  return (
    <div
      role="group"
      aria-label="Language selector"
      className="flex items-center bg-[#141418] p-0.5 rounded border border-[#222226] text-xs font-mono"
    >
      <button
        type="button"
        onClick={() => toggleLanguage('en')}
        aria-pressed={language === 'en'}
        className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
          language === 'en'
            ? 'bg-[#f4f4f5] text-[#09090b]'
            : 'text-[#71717a] hover:text-[#f4f4f5]'
        }`}
        title="English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => toggleLanguage('id')}
        aria-pressed={language === 'id'}
        className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
          language === 'id'
            ? 'bg-[#f4f4f5] text-[#09090b]'
            : 'text-[#71717a] hover:text-[#f4f4f5]'
        }`}
        title="Bahasa Indonesia"
      >
        ID
      </button>
    </div>
  )
}
