'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Check } from 'lucide-react'
import useStore from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  THEME_VARIANTS,
  normalizeTheme,
  type ThemeId,
  type ThemeVariant,
} from '@/lib/themes'

/**
 * Theme Preview Lab
 *
 * Temporary premium comparison UI inside Settings > Appearance.
 * Lets the user switch between the 4 theme variants:
 *   Old Light, Old Dark, Light E, Dark E.
 *
 * The preview cards are the primary selection mechanism. A compact
 * segmented pill above the grid offers quick switching.
 *
 * To remove this lab after picking the final pair:
 *  1. Delete this file.
 *  2. Delete `lib/themes.ts` or reduce it to the surviving pair.
 *  3. Remove the `.old-*` / `.*-e` blocks in `globals.css` you don't want.
 */
export function ThemePreviewLab() {
  const { theme, setTheme } = useTheme()
  const updateNotificationSettings = useStore(
    (state) => state.updateNotificationSettings,
  )
  const setStoreTheme = useStore((state) => state.setTheme)

  const activeId: ThemeId = useMemo(() => normalizeTheme(theme), [theme])

  const handleSelect = (id: ThemeId) => {
    if (id === activeId) return
    setTheme(id)
    setStoreTheme(id)
    // Persist through the same bridge the rest of the app uses.
    updateNotificationSettings({ theme: id })
  }

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">
            Theme Preview Lab
          </h3>
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] px-2 py-0.5 rounded-full border border-gold/25 text-gold/90 bg-gold/5">
            Preview
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Compare the current themes against the new premium direction.
          Tap a card to apply instantly.
        </p>
      </div>

      {/* Segmented quick switcher */}
      <SegmentedThemeSwitcher
        activeId={activeId}
        onSelect={handleSelect}
      />

      {/* 2x2 Preview grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {THEME_VARIANTS.map((variant) => (
          <ThemePreviewCard
            key={variant.id}
            variant={variant}
            isActive={variant.id === activeId}
            onSelect={() => handleSelect(variant.id)}
          />
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- */

function SegmentedThemeSwitcher({
  activeId,
  onSelect,
}: {
  activeId: ThemeId
  onSelect: (id: ThemeId) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Quick theme switcher"
      className="relative flex items-center gap-1 p-1 rounded-full border border-border bg-muted/50 backdrop-blur-sm w-fit max-w-full overflow-x-auto"
    >
      {THEME_VARIANTS.map((variant) => {
        const isActive = variant.id === activeId
        return (
          <button
            key={variant.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(variant.id)}
            className={cn(
              'relative px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {isActive && (
              <motion.span
                layoutId="theme-pill-active"
                className="absolute inset-0 rounded-full bg-card shadow-sm border border-border"
                transition={{ type: 'spring', stiffness: 420, damping: 38 }}
              />
            )}
            <span className="relative z-10">{variant.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------- */

function ThemePreviewCard({
  variant,
  isActive,
  onSelect,
}: {
  variant: ThemeVariant
  isActive: boolean
  onSelect: () => void
}) {
  const { swatches, label, description, generation, mode } = variant

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      aria-pressed={isActive}
      aria-label={`Apply ${label} theme`}
      className={cn(
        'group relative text-left rounded-2xl overflow-hidden cursor-pointer',
        'border transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isActive
          ? 'border-gold/60 shadow-[0_0_0_1px_rgba(201,164,110,0.35),0_18px_44px_-18px_rgba(201,164,110,0.35)]'
          : 'border-border/60 hover:border-gold/30 shadow-sm hover:shadow-md',
      )}
    >
      {/* Selected check badge */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 26 }}
          className="absolute top-2.5 right-2.5 z-20 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
          style={{
            background: swatches.accent,
            color: mode === 'dark' ? swatches.background : '#FFFFFF',
          }}
        >
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        </motion.div>
      )}

      {/* Generation chip */}
      <div className="absolute top-2.5 left-2.5 z-20">
        <span
          className={cn(
            'text-[9px] font-semibold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full',
            generation === 'premium'
              ? 'bg-gold/15 text-gold border border-gold/30'
              : 'bg-muted/70 text-muted-foreground border border-border',
          )}
        >
          {generation === 'premium' ? 'New' : 'Baseline'}
        </span>
      </div>

      {/* Mini app preview */}
      <MiniThemePreview swatches={swatches} />

      {/* Label strip */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-3 bg-card border-t border-border/60">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {label}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span
            className="w-3 h-3 rounded-full border border-border/60"
            style={{ background: swatches.accent }}
            aria-hidden
          />
          <span
            className="w-3 h-3 rounded-full border border-border/60"
            style={{ background: swatches.card }}
            aria-hidden
          />
          <span
            className="w-3 h-3 rounded-full border border-border/60"
            style={{ background: swatches.background }}
            aria-hidden
          />
        </div>
      </div>
    </motion.button>
  )
}

/* -------------------------------------------------------------------- */

/**
 * A miniature, static preview of the theme's app shell:
 *   sidebar · header/card · accent chip · text hierarchy.
 * Built with inline styles so each card can paint its own palette
 * regardless of the currently active theme.
 */
function MiniThemePreview({ swatches }: { swatches: ThemeVariant['swatches'] }) {
  return (
    <div
      className="relative h-32 sm:h-36 w-full"
      style={{ background: swatches.background }}
      aria-hidden
    >
      {/* Sidebar */}
      <div
        className="absolute top-0 left-0 bottom-0 w-[28%]"
        style={{
          background: swatches.sidebar,
          borderRight: `1px solid ${swatches.border}`,
        }}
      >
        {/* Sidebar logo dot */}
        <div className="absolute top-3 left-3 w-3 h-3 rounded-full" style={{ background: swatches.accent }} />
        {/* Sidebar items */}
        <div className="absolute top-10 left-2 right-2 space-y-1.5">
          <div className="h-1.5 rounded-full" style={{ background: swatches.accent, opacity: 0.8, width: '78%' }} />
          <div className="h-1.5 rounded-full" style={{ background: swatches.textMuted, opacity: 0.45, width: '60%' }} />
          <div className="h-1.5 rounded-full" style={{ background: swatches.textMuted, opacity: 0.3, width: '68%' }} />
          <div className="h-1.5 rounded-full" style={{ background: swatches.textMuted, opacity: 0.3, width: '52%' }} />
        </div>
      </div>

      {/* Main content area */}
      <div className="absolute top-3 left-[31%] right-3 bottom-3 flex flex-col gap-2">
        {/* Heading */}
        <div
          className="h-2 rounded-full"
          style={{ background: swatches.text, opacity: 0.9, width: '55%' }}
        />
        {/* Subheading */}
        <div
          className="h-1.5 rounded-full"
          style={{ background: swatches.textMuted, opacity: 0.55, width: '35%' }}
        />

        {/* Card surface */}
        <div
          className="mt-1.5 flex-1 rounded-lg p-2 flex items-center gap-2"
          style={{
            background: swatches.card,
            border: `1px solid ${swatches.border}`,
            boxShadow:
              '0 6px 16px -8px rgba(0,0,0,0.08), 0 2px 6px -2px rgba(0,0,0,0.04)',
          }}
        >
          {/* Accent chip */}
          <div
            className="w-6 h-6 rounded-md shrink-0"
            style={{ background: swatches.accent, opacity: 0.95 }}
          />
          <div className="flex-1 flex flex-col gap-1">
            <div
              className="h-1.5 rounded-full"
              style={{ background: swatches.text, opacity: 0.75, width: '78%' }}
            />
            <div
              className="h-1 rounded-full"
              style={{
                background: swatches.textMuted,
                opacity: 0.55,
                width: '50%',
              }}
            />
          </div>
          {/* Accent dot */}
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: swatches.accent }}
          />
        </div>
      </div>
    </div>
  )
}
