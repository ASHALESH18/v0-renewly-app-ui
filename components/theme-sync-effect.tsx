'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { isThemeId } from '@/lib/themes'

/**
 * ThemeSyncEffect
 *
 * Syncs the data-theme-variant attribute on <html> whenever
 * next-themes updates the theme class. This keeps the two
 * in sync after hydration and during theme switching.
 */
export function ThemeSyncEffect() {
  const { theme } = useTheme()

  useEffect(() => {
    if (!theme || !isThemeId(theme)) return

    const root = document.documentElement
    
    // Update data-theme-variant attribute
    root.setAttribute('data-theme-variant', theme)
    
    // Also ensure the correct .dark class is set
    const isDark = theme === 'old-dark' || theme === 'dark-e'
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return null
}
