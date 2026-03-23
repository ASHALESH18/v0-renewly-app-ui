/**
 * Leak Report Status Configuration
 * Premium 5-level status system for subscription health scoring
 * Maintains luxury fintech aesthetic with clear state differentiation
 */

export type LeakStatusLevel = 'healthy' | 'stable' | 'needs-attention' | 'at-risk' | 'critical'

export interface LeakStatusConfig {
  label: string
  scoreRange: [number, number] // [min, max]
  textColor: string
  bgColor: string
  glowColor: string
  glowStrength: string
  borderColor: string
  description: string
}

export const LEAK_STATUS_CONFIGS: Record<LeakStatusLevel, LeakStatusConfig> = {
  healthy: {
    label: 'Healthy',
    scoreRange: [85, 100],
    textColor: 'text-emerald',
    bgColor: 'bg-emerald/15',
    glowColor: 'rgba(80, 184, 160, 0.4)',
    glowStrength: 'drop-shadow-[0_0_12px_rgba(80,184,160,0.3)]',
    borderColor: 'border-emerald/30',
    description: 'Your subscriptions are well-managed and optimized',
  },
  stable: {
    label: 'Stable',
    scoreRange: [70, 84],
    textColor: 'text-emerald-200',
    bgColor: 'bg-emerald/10',
    glowColor: 'rgba(120, 200, 180, 0.3)',
    glowStrength: 'drop-shadow-[0_0_10px_rgba(120,200,180,0.25)]',
    borderColor: 'border-emerald/25',
    description: 'Minor optimizations possible',
  },
  'needs-attention': {
    label: 'Needs Attention',
    scoreRange: [50, 69],
    textColor: 'text-gold',
    bgColor: 'bg-gold/15',
    glowColor: 'rgba(199, 163, 106, 0.4)',
    glowStrength: 'drop-shadow-[0_0_12px_rgba(199,163,106,0.3)]',
    borderColor: 'border-gold/40',
    description: 'Consider reviewing unused subscriptions',
  },
  'at-risk': {
    label: 'At Risk',
    scoreRange: [30, 49],
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    glowStrength: 'drop-shadow-[0_0_14px_rgba(245,158,11,0.35)]',
    borderColor: 'border-amber-500/40',
    description: 'Multiple leaks detected - immediate review recommended',
  },
  critical: {
    label: 'Critical',
    scoreRange: [0, 29],
    textColor: 'text-crimson',
    bgColor: 'bg-crimson/20',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    glowStrength: 'drop-shadow-[0_0_16px_rgba(239,68,68,0.4)]',
    borderColor: 'border-crimson/50',
    description: 'Significant leaks - urgent action required',
  },
}

/**
 * Determine status level from score
 */
export function getLeakStatusLevel(score: number): LeakStatusLevel {
  if (score >= 85) return 'healthy'
  if (score >= 70) return 'stable'
  if (score >= 50) return 'needs-attention'
  if (score >= 30) return 'at-risk'
  return 'critical'
}

/**
 * Get status config for a given score
 */
export function getLeakStatusConfig(score: number): LeakStatusConfig {
  const level = getLeakStatusLevel(score)
  return LEAK_STATUS_CONFIGS[level]
}

/**
 * Get color for legacy compatibility
 */
export function getLeakStatusColor(score: number): string {
  const config = getLeakStatusConfig(score)
  if (config.label === 'Healthy') return 'text-emerald'
  if (config.label === 'Stable') return 'text-emerald-200'
  if (config.label === 'Needs Attention') return 'text-gold'
  if (config.label === 'At Risk') return 'text-amber-400'
  return 'text-crimson'
}

/**
 * Get label for legacy compatibility
 */
export function getLeakStatusLabel(score: number): string {
  return getLeakStatusConfig(score).label
}
