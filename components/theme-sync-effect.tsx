'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

/**
 * ThemeSyncEffect
 *
 * Ensures the `.dark` CSS class is applied correctly alongside the
 * `data-theme` attribute managed by next-themes. This keeps all existing
 * `.dark .xxx` rules in the codebase working for the Glass theme, which
 * uses dark's color base as a foundation and then layers its own
 * `[data-theme="glass"]` overrides on top.
 *
 * IMPORTANT STABILITY NOTE:
 * Every classList mutation below uses a SINGLE token (no spaces).
 * This avoids the DOMTokenList `InvalidCharacterError` that caused
 * the previous theme experiment to crash.
 *
 *   - `light` → remove `.dark`
 *   - `dark`  → add `.dark`
 *   - `glass` → add `.dark` (glass uses dark's color base + overrides)
 */
export function ThemeSyncEffect() {
  const { theme, resolvedTheme } = useTheme()

  useEffect(() => {
    const active = (theme ?? resolvedTheme ?? 'dark') as string
    const root = document.documentElement

    const needsDark = active === 'dark' || active === 'glass'

    // Single-token classList operations only. Never pass a string with a space.
    if (needsDark) {
      if (!root.classList.contains('dark')) {
        root.classList.add('dark')
      }
    } else {
      if (root.classList.contains('dark')) {
        root.classList.remove('dark')
      }
    }
  }, [theme, resolvedTheme])

  return null
}
