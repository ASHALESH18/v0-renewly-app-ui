'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import useStore from '@/lib/store'
import { getLocaleFromLanguage } from '@/lib/preferences-format'

type ThemeChoice = 'light' | 'dark' | 'glass'
type BaseTheme = 'light' | 'dark'
type Appearance = 'standard' | 'glass'

function resolveThemeChoice(choice: ThemeChoice): {
  baseTheme: BaseTheme
  appearance: Appearance
} {
  if (choice === 'light') {
    return { baseTheme: 'light', appearance: 'standard' }
  }

  if (choice === 'glass') {
    return { baseTheme: 'dark', appearance: 'glass' }
  }

  return { baseTheme: 'dark', appearance: 'standard' }
}

export function PreferencesBridge() {
  const notificationSettings = useStore((state) => state.notificationSettings)
  const fallbackTheme = useStore((state) => state.theme)
  const { setTheme: setNextTheme, theme: currentTheme } = useTheme()
  const [storeHydrated, setStoreHydrated] = useState(false)

  const persistApi = (useStore as any).persist
  const themeChoice = (fallbackTheme || notificationSettings.theme || 'dark') as ThemeChoice
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
    const root = document.documentElement
    root.lang = language || 'en'
    root.dataset.locale = getLocaleFromLanguage(language)
    root.dataset.currency = currencyCode
  }, [language, currencyCode])

  useEffect(() => {
    if (!storeHydrated) return

    const { baseTheme, appearance } = resolveThemeChoice(themeChoice)
    const root = document.documentElement

    root.dataset.appearance = appearance
    root.style.colorScheme = baseTheme

    try {
      localStorage.setItem('renewly-theme-choice', themeChoice)
      localStorage.removeItem('renewly-theme')
      document.cookie = `renewly-theme-choice=${themeChoice}; path=/; max-age=31536000; samesite=lax`
      document.cookie = 'renewly-theme=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    } catch {
      // ignore storage/cookie errors
    }

    if (currentTheme !== baseTheme) {
      setNextTheme(baseTheme)
    }
  }, [storeHydrated, themeChoice, currentTheme, setNextTheme])

  return null
}