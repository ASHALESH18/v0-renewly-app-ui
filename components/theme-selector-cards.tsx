'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Check } from 'lucide-react'
import useStore from '@/lib/store'
import { cn } from '@/lib/utils'

/**
 * ThemeSelectorCards
 *
 * Premium 3-card theme selector used in Settings > Appearance.
 * Each card renders a small static preview painted with that theme's
 * own palette (independent of the currently-active app theme), so users
 * can compare all three options at once.
 *
 * Wiring:
 *   - Applies the theme via `next-themes` (`setTheme`)
 *   - Persists to the Zustand store (`setTheme` + `updateNotificationSettings`)
 *     so the choice survives reload and cross-device sync.
 */

type ThemeId = 'light' | 'dark' | 'glass'

interface ThemeOption {
  id: ThemeId
  label: string
  description: string
  /** Preview palette — painted into the preview card */
  preview: {
    bg: string
    sidebar: string
    card: string
    cardBorder: string
    text: string
    mutedText: string
    accent: string
    /** Optional atmospheric overlay (used for Glass) */
    atmosphere?: string
    /** Optional card translucency hint — shows frosted look */
    cardBackdrop?: string
  }
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'light',
    label: 'Light',
    description: 'Warm ivory, crisp clarity',
    preview: {
      bg: '#F8F4EC',
      sidebar: '#FCF9F3',
      card: '#FFFEFA',
      cardBorder: 'rgba(176, 132, 64, 0.14)',
      text: '#171411',
      mutedText: '#5C544A',
      accent: '#B08440',
    },
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Deep obsidian, cinematic',
    preview: {
      bg: '#08090C',
      sidebar: '#0D0F13',
      card: '#111418',
      cardBorder: 'rgba(255, 255, 255, 0.07)',
      text: '#F6F2EA',
      mutedText: '#A8AEB8',
      accent: '#D4B070',
    },
  },
  {
    id: 'glass',
    label: 'Glass',
    description: 'Apple Glass luxury, airy depth',
    preview: {
      bg: '#0B0E1A',
      sidebar: 'rgba(22, 25, 42, 0.58)',
      card: 'rgba(30, 34, 54, 0.52)',
      cardBorder: 'rgba(180, 200, 255, 0.16)',
      text: '#ECEEFB',
      mutedText: '#A8AEC8',
      accent: '#D4B070',
      atmosphere:
        'radial-gradient(ellipse 80% 60% at 15% 12%, rgba(148, 168, 235, 0.38) 0%, transparent 55%), radial-gradient(ellipse 70% 55% at 85% 82%, rgba(178, 148, 215, 0.26) 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 55% 50%, rgba(130, 155, 200, 0.16) 0%, transparent 60%)',
      cardBackdrop: 'blur(14px) saturate(180%)',
    },
  },
]

export function ThemeSelectorCards() {
  const { setTheme: setNextTheme, theme: currentNextTheme } = useTheme()
  const storeTheme = useStore((s) => s.theme)
  const setStoreTheme = useStore((s) => s.setTheme)
  const updateNotificationSettings = useStore((s) => s.updateNotificationSettings)

  // Prefer the store (persisted) but fall back to next-themes
  const activeTheme = useMemo<ThemeId>(() => {
    const candidate = (storeTheme ?? currentNextTheme ?? 'dark') as string
    if (candidate === 'light' || candidate === 'dark' || candidate === 'glass') {
      return candidate
    }
    return 'dark'
  }, [storeTheme, currentNextTheme])

  const handleSelect = async (id: ThemeId) => {
    if (id === activeTheme) return
    setNextTheme(id)
    setStoreTheme(id)
    try {
      await updateNotificationSettings({ theme: id })
    } catch {
      /* non-fatal — next-themes + store already applied the UI change */
    }
  }

  return (
    <div className="space-y-4">
      {/* Section intro */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Theme</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose how Renewly looks across the app.
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-2 py-1 rounded-full border border-border">
          {activeTheme === 'glass' ? 'Premium' : 'Standard'}
        </span>
      </div>

      {/* 3-card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {THEME_OPTIONS.map((option) => {
          const isSelected = option.id === activeTheme
          return (
            <motion.button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              whileTap={{ scale: 0.985 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              aria-pressed={isSelected}
              aria-label={`Select ${option.label} theme`}
              className={cn(
                'group relative text-left rounded-2xl overflow-hidden',
                'border transition-all duration-300 cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isSelected
                  ? 'border-gold/50 shadow-[0_0_0_1px_rgba(199,163,106,0.35),0_18px_44px_-14px_rgba(199,163,106,0.25)]'
                  : 'border-border hover:border-gold/25 hover:shadow-md',
              )}
            >
              {/* Preview canvas — painted with the option's own palette */}
              <ThemePreviewCanvas option={option} />

              {/* Footer — label + check badge */}
              <div className="flex items-center justify-between px-3.5 py-3 bg-card border-t border-border">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground leading-tight truncate">
                    {option.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
                    {option.description}
                  </div>
                </div>

                <div
                  className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full shrink-0',
                    'transition-all duration-300',
                    isSelected
                      ? 'bg-gold text-background scale-100 opacity-100'
                      : 'bg-transparent border border-border scale-90 opacity-50',
                  )}
                  aria-hidden="true"
                >
                  {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                </div>
              </div>

              {/* Selected ring glow accent */}
              {isSelected && (
                <motion.div
                  layoutId="theme-selector-ring"
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    boxShadow:
                      'inset 0 0 0 1px rgba(199, 163, 106, 0.5), 0 0 36px -8px rgba(199, 163, 106, 0.22)',
                  }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Miniature static preview of the app shell painted using the option's palette.
 * Renders:
 *   - a full-bleed background (with optional atmospheric glow for Glass)
 *   - a sidebar band
 *   - a primary card surface with a title, a meta line, and an accent chip
 */
function ThemePreviewCanvas({ option }: { option: ThemeOption }) {
  const { preview } = option
  return (
    <div
      className="relative h-28 w-full overflow-hidden"
      style={{ backgroundColor: preview.bg }}
    >
      {/* Atmospheric glow (Glass) */}
      {preview.atmosphere && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: preview.atmosphere }}
          aria-hidden="true"
        />
      )}

      <div className="absolute inset-0 flex p-2.5 gap-2.5">
        {/* Sidebar */}
        <div
          className="w-[22%] h-full rounded-md"
          style={{
            backgroundColor: preview.sidebar,
            boxShadow: `inset 0 0 0 1px ${preview.cardBorder}`,
          }}
        >
          {/* sidebar rails */}
          <div className="flex flex-col gap-1.5 p-2">
            <div className="h-1.5 rounded-full w-10/12" style={{ backgroundColor: preview.accent, opacity: 0.85 }} />
            <div className="h-1 rounded-full w-7/12" style={{ backgroundColor: preview.mutedText, opacity: 0.45 }} />
            <div className="h-1 rounded-full w-9/12" style={{ backgroundColor: preview.mutedText, opacity: 0.35 }} />
            <div className="h-1 rounded-full w-6/12" style={{ backgroundColor: preview.mutedText, opacity: 0.28 }} />
          </div>
        </div>

        {/* Main card */}
        <div className="flex-1 h-full flex flex-col gap-1.5">
          {/* Top card */}
          <div
            className="flex-1 rounded-md p-2 flex flex-col justify-between"
            style={{
              background: preview.card,
              border: `1px solid ${preview.cardBorder}`,
              backdropFilter: preview.cardBackdrop,
              WebkitBackdropFilter: preview.cardBackdrop,
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="h-1.5 rounded-full w-1/3"
                style={{ backgroundColor: preview.text, opacity: 0.9 }}
              />
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: preview.accent }}
              />
            </div>
            <div className="flex items-end gap-1.5">
              <div
                className="h-2 rounded-sm"
                style={{ width: '30%', backgroundColor: preview.accent, opacity: 0.9 }}
              />
              <div
                className="h-1 rounded-sm"
                style={{ width: '20%', backgroundColor: preview.mutedText, opacity: 0.55 }}
              />
            </div>
          </div>

          {/* Bottom sparkline/row */}
          <div
            className="h-[34%] rounded-md p-2 flex items-center gap-1"
            style={{
              background: preview.card,
              border: `1px solid ${preview.cardBorder}`,
              backdropFilter: preview.cardBackdrop,
              WebkitBackdropFilter: preview.cardBackdrop,
            }}
          >
            {[0.35, 0.55, 0.4, 0.7, 0.5, 0.85, 0.6].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-[2px]"
                style={{
                  height: `${h * 100}%`,
                  backgroundColor: preview.accent,
                  opacity: 0.4 + h * 0.4,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
