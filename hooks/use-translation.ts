'use client'

import { useMemo } from 'react'
import useStore from '@/lib/store'
import { getTranslations, type Translations, type SupportedLanguage } from '@/lib/i18n'

/**
 * Hook to get translations based on the user's language preference
 * 
 * Usage:
 * const { t } = useTranslation()
 * <h1>{t.settings}</h1>
 */
export function useTranslation() {
  const language = useStore((state) => state.notificationSettings.language)
  
  const translations = useMemo(() => {
    return getTranslations(language || 'en')
  }, [language])
  
  return {
    t: translations,
    language: (language || 'en') as SupportedLanguage,
  }
}

/**
 * Get a single translation key (useful in callbacks)
 */
export function useT() {
  const { t } = useTranslation()
  return (key: keyof Translations) => t[key]
}
