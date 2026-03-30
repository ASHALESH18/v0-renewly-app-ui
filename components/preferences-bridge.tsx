'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import useStore from '@/lib/store'
import { getLocaleFromLanguage } from '@/lib/preferences-format'

export function PreferencesBridge() {
  const notificationSettings = useStore((state) => state.notificationSettings)
  const fallbackTheme = useStore((state) => state.theme)
  const { setTheme: setNextTheme } = useTheme()

  const storeTheme = notificationSettings.theme || fallbackTheme || 'dark'
  const language = notificationSettings.language || 'en'
  const currencyCode = notificationSettings.currencyCode || 'INR'

  // Sync store theme preference with next-themes
  useEffect(() => {
    setNextTheme(storeTheme)
  }, [storeTheme, setNextTheme])

  // Set language and currency attributes
  useEffect(() => {
    const root = document.documentElement
    root.lang = language || 'en'
    root.dataset.locale = getLocaleFromLanguage(language)
    root.dataset.currency = currencyCode
  }, [language, currencyCode])

  return null
}
