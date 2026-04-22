'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'
import { DEFAULT_THEME, THEME_CLASS_MAP, THEME_IDS } from '@/lib/themes'

/**
 * Renewly ThemeProvider
 *
 * Wraps `next-themes` to support the 4 temporary theme variants used
 * by the Theme Preview Lab:
 *   - `old-light`, `old-dark`  (baseline)
 *   - `light-e`, `dark-e`      (new premium direction)
 *
 * The `value` mapping ensures dark variants also receive the `.dark`
 * class on <html>, so every existing `.dark` selector in the codebase
 * continues to work unchanged.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={DEFAULT_THEME}
      themes={[...THEME_IDS]}
      value={THEME_CLASS_MAP}
      enableSystem={false}
      disableTransitionOnChange
      storageKey="renewly-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
