/**
 * Renewly Theme System
 *
 * Temporary 4-way theme comparison setup.
 *
 * - `old-light` / `old-dark`: Existing baseline themes (unchanged).
 * - `light-e` / `dark-e`: New premium variants for comparison.
 *
 * When the final direction is picked, delete the entries you don't want
 * from `THEME_VARIANTS`, remove the corresponding `.old-*` / `.*-e`
 * token blocks in `globals.css`, and map the final theme id back to
 * a clean `light` / `dark` pair. The rest of the app is wired through
 * tokens so nothing else needs touching.
 */

export type ThemeId = 'old-light' | 'old-dark' | 'light-e' | 'dark-e'

/** Legacy theme values stored by older builds. */
export type LegacyThemeId = 'light' | 'dark'

export type AnyThemeId = ThemeId | LegacyThemeId

export type ThemeMode = 'light' | 'dark'

export interface ThemeSwatches {
  /** App background. */
  background: string
  /** Sidebar / nav band. */
  sidebar: string
  /** Primary card surface. */
  card: string
  /** Accent color (gold). */
  accent: string
  /** Foreground text. */
  text: string
  /** Muted text. */
  textMuted: string
  /** Border color. */
  border: string
}

export interface ThemeVariant {
  id: ThemeId
  /** Exact label shown in the UI. */
  label: string
  /** Short marketing descriptor. */
  description: string
  mode: ThemeMode
  /** Marks the new premium direction vs the old baseline. */
  generation: 'baseline' | 'premium'
  /** Swatches used by the preview card chrome. */
  swatches: ThemeSwatches
}

export const THEME_VARIANTS: readonly ThemeVariant[] = [
  {
    id: 'old-light',
    label: 'Old Light',
    description: 'Current baseline light theme',
    mode: 'light',
    generation: 'baseline',
    swatches: {
      background: '#F8F4EC',
      sidebar: '#FCF9F3',
      card: '#FFFEFA',
      accent: '#B08440',
      text: '#171411',
      textMuted: '#5C544A',
      border: '#DED4C4',
    },
  },
  {
    id: 'old-dark',
    label: 'Old Dark',
    description: 'Current baseline dark theme',
    mode: 'dark',
    generation: 'baseline',
    swatches: {
      background: '#08090C',
      sidebar: '#0D0F13',
      card: '#111418',
      accent: '#D4B070',
      text: '#F6F2EA',
      textMuted: '#A8AEB8',
      border: 'rgba(255,255,255,0.08)',
    },
  },
  {
    id: 'light-e',
    label: 'Light E',
    description: 'Warm pearl, editorial clarity',
    mode: 'light',
    generation: 'premium',
    swatches: {
      background: '#F2ECDE',
      sidebar: '#EAE2D0',
      card: '#FBF7EE',
      accent: '#9C7836',
      text: '#1C1712',
      textMuted: '#5A5247',
      border: '#D6CCB8',
    },
  },
  {
    id: 'dark-e',
    label: 'Dark E',
    description: 'Graphite obsidian, restrained gold',
    mode: 'dark',
    generation: 'premium',
    swatches: {
      background: '#0B0E14',
      sidebar: '#0F131B',
      card: '#161B25',
      accent: '#C9A46E',
      text: '#ECE6DA',
      textMuted: '#9AA0AC',
      border: 'rgba(201,164,110,0.14)',
    },
  },
] as const

export const DEFAULT_THEME: ThemeId = 'dark-e'

/**
 * FIX: No longer use multi-word class strings in THEME_CLASS_MAP.
 * 
 * Instead:
 * - Use `.dark` class only for dark mode (mode-based)
 * - Store variant id in data-theme-variant="..." attribute
 * 
 * This avoids InvalidCharacterError from DOMTokenList.
 */
export const THEME_MODE_MAP: { [themeId: string]: 'dark' | 'light' } = {
  'old-light': 'light',
  'old-dark': 'dark',
  'light-e': 'light',
  'dark-e': 'dark',
}

export const THEME_IDS: readonly ThemeId[] = THEME_VARIANTS.map((t) => t.id)

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value)
}

/**
 * Normalize any stored theme value (including legacy `light`/`dark`)
 * into one of the current `ThemeId`s. Legacy users stay on their
 * baseline so nothing visually changes until they opt into E.
 */
export function normalizeTheme(value: unknown): ThemeId {
  if (isThemeId(value)) return value
  if (value === 'light') return 'old-light'
  if (value === 'dark') return 'old-dark'
  return DEFAULT_THEME
}

export function getThemeVariant(id: ThemeId): ThemeVariant {
  return THEME_VARIANTS.find((t) => t.id === id) ?? THEME_VARIANTS[3]
}

/**
 * Get the base mode (`dark` or `light`) for a theme variant.
 * Used to set the `.dark` class on `<html>`.
 */
export function getThemeMode(id: ThemeId): ThemeMode {
  return getThemeVariant(id).mode
}
