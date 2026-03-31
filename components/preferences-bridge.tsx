'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import useStore from '@/lib/store'
import { getLocaleFromLanguage } from '@/lib/preferences-format'

export function PreferencesBridge() {
  const notificationSettings = useStore((state) => state.notificationSettings)
  const fallbackTheme = useStore((state) => state.theme)
  const { setTheme: setNextTheme, theme: currentTheme } = useTheme()
  const hasInitialized = useRef(false)

  const storeTheme = fallbackTheme || notificationSettings.theme || 'dark'
  const language = notificationSettings.language || 'en'
  const currencyCode = notificationSettings.currencyCode || 'INR'

  // Sync store theme preference with next-themes and localStorage for first-paint consistency
  useEffect(() => {
    // Always sync to localStorage for pre-hydration script on next page load
    if (typeof window !== 'undefined') {
      localStorage.setItem('renewly-theme', storeTheme)
    }

    // Only update next-themes if the theme actually differs to avoid unnecessary re-renders
    if (currentTheme !== storeTheme) {
      setNextTheme(storeTheme)
    }

    hasInitialized.current = true
  }, [storeTheme, setNextTheme, currentTheme])

  // Set language and currency attributes
  useEffect(() => {
    const root = document.documentElement
    root.lang = language || 'en'
    root.dataset.locale = getLocaleFromLanguage(language)
    root.dataset.currency = currencyCode
  }, [language, currencyCode])

  return null
}
