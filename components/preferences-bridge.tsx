'use client'

import { useEffect } from 'react'
import useStore from '@/lib/store'
import { getLocaleFromLanguage } from '@/lib/preferences-format'

export function PreferencesBridge() {
  const notificationSettings = useStore((state) => state.notificationSettings)
  const fallbackTheme = useStore((state) => state.theme)

  const theme = notificationSettings.theme || fallbackTheme || 'dark'
  const language = notificationSettings.language || 'en'
  const currencyCode = notificationSettings.currencyCode || 'INR'

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme !== 'light')
    root.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    root.lang = language || 'en'
    root.dataset.locale = getLocaleFromLanguage(language)
    root.dataset.currency = currencyCode
  }, [language, currencyCode])

  return null
}