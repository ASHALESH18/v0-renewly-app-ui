'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import useStore from '@/lib/store'
import { getLocaleFromLanguage } from '@/lib/preferences-format'
import { normalizeTheme } from '@/lib/themes'

export function PreferencesBridge() {
  const notificationSettings = useStore((state) => state.notificationSettings)
  const fallbackTheme = useStore((state) => state.theme)
  const { setTheme: setNextTheme, theme: currentTheme } = useTheme()
  const [storeHydrated, setStoreHydrated] = useState(false)

  const persistApi = (useStore as any).persist
  // Normalize any legacy 'light'/'dark' values into one of the 4 theme ids
  // supported by the Theme Preview Lab.
  const storeTheme = normalizeTheme(fallbackTheme || notificationSettings.theme)
  const language = notificationSettings.language || 'en'
  const currencyCode = notificationSettings.currencyCode || 'INR'

  useEffect(() => {
    if (!persistApi) {
      setStoreHydrated(true)
      return
    }

    setStoreHydrated(persistApi.hasHydrated())

    const unsubHydrate = persistApi.onHydrate(() => {
      setStoreHydrated(false)
    })

    const unsubFinish = persistApi.onFinishHydration(() => {
      setStoreHydrated(true)
    })

    return () => {
      unsubHydrate?.()
      unsubFinish?.()
    }
  }, [persistApi])

  useEffect(() => {
    if (!storeHydrated) return

    if (typeof window !== 'undefined') {
      localStorage.setItem('renewly-theme', storeTheme)
      document.cookie = `renewly-theme=${storeTheme}; path=/; max-age=31536000; samesite=lax`
    }

    if (currentTheme !== storeTheme) {
      setNextTheme(storeTheme)
    }
  }, [storeHydrated, storeTheme, setNextTheme, currentTheme])

  useEffect(() => {
    const root = document.documentElement
    root.lang = language || 'en'
    root.dataset.locale = getLocaleFromLanguage(language)
    root.dataset.currency = currencyCode
  }, [language, currencyCode])

  return null
}
