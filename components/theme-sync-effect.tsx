'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

/**
 * ThemeSyncEffect
 *
 * Keeps the `.dark` CSS class on `<html>` in sync with the active theme
 * so every `.dark .xxx` rule in globals.css continues to apply in both
 * Dark and Glass modes (Glass uses Dark's color base + its own
 * `[data-theme="glass"]` overrides).
 *
 * Stability rules this implementation follows:
 *
 *  1. Never toggle the class until next-themes has mounted AND reported
 *     a concrete theme value. Toggling on a stale/undefined value during
 *     hydration is what caused the Light → Dark → Light flash.
 *
 *  2. Never "default to dark" when theme is undefined — the pre-hydration
 *     inline script in `app/layout.tsx` has already applied the correct
 *     class from the cookie/localStorage, so doing nothing is safe.
 *
 *  3. Every classList mutation uses a SINGLE token (no spaces), avoiding
 *     the DOMTokenList `InvalidCharacterError` that previously crashed
 *     the theme system.
 */
export function ThemeSyncEffect() {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Prefer the explicit `theme` value, then `resolvedTheme`.
    // If both are undefined, do nothing — the pre-hydration script
    // already put the correct class on <html>.
    const active = (theme ?? resolvedTheme) as string | undefined
    if (!active) return
    if (active !== 'light' && active !== 'dark' && active !== 'glass') return

    const root = document.documentElement
    const needsDark = active === 'dark' || active === 'glass'

    // Single-token classList operations only.
    if (needsDark) {
      if (!root.classList.contains('dark')) {
        root.classList.add('dark')
      }
    } else {
      if (root.classList.contains('dark')) {
        root.classList.remove('dark')
      }
    }
  }, [mounted, theme, resolvedTheme])

  return null
}
