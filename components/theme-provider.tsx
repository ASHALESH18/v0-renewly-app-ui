'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'
import { DEFAULT_THEME, THEME_IDS } from '@/lib/themes'

/**
 * Renewly ThemeProvider (Fixed)
 *
 * FIX: No longer use `value` mapping with multi-word class strings.
 * Instead, next-themes manages the variant ID directly as the theme name,
 * and we handle `.dark` class and `data-theme-variant` separately in layout.tsx.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={DEFAULT_THEME}
      themes={[...THEME_IDS]}
      enableSystem={false}
      disableTransitionOnChange
      storageKey="renewly-theme"
      forcedTheme={undefined}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
