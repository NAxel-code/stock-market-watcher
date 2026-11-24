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
      className="flex items-center bg-[#10141D] p-0.5 rounded-lg border border-[#232B3A] text-xs font-mono"
    >
      <button
        type="button"
        onClick={() => toggleLanguage('en')}
        aria-pressed={language === 'en'}
        className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
          language === 'en'
            ? 'bg-[#1E2638] text-[#F0F4F8] shadow-xs'
            : 'text-[#6F7887] hover:text-[#F0F4F8]'
        }`}
        title="English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => toggleLanguage('id')}
        aria-pressed={language === 'id'}
        className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
          language === 'id'
            ? 'bg-[#1E2638] text-[#00E599] shadow-xs'
            : 'text-[#6F7887] hover:text-[#F0F4F8]'
        }`}
        title="Bahasa Indonesia"
      >
        ID
      </button>
    </div>
  )
}
