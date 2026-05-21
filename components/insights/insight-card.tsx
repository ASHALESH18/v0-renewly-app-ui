'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, Info, AlertTriangle, ChevronRight } from 'lucide-react'
import type { Insight } from '@/lib/insights/insight-types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const severityConfig = {
  info: {
    icon: Info,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    iconColor: 'text-blue-500',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    iconColor: 'text-emerald-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    iconColor: 'text-amber-500',
  },
  critical: {
    icon: AlertCircle,
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-600 dark:text-red-400',
    iconColor: 'text-red-500',
  },
}

interface InsightCardProps {
  insight: Insight
  index?: number
}

export function InsightCard({ insight, index = 0 }: InsightCardProps) {
  const config = severityConfig[insight.severity]
  const Icon = config.icon
  const [expanded, setExpanded] = React.useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border ${config.bg} ${config.border} p-4 transition-all hover:border-opacity-100`}
    >
      <div className="flex gap-4">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <Icon className="h-5 w-5 mt-0.5" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-sm font-semibold text-foreground">{insight.title}</h3>

          {/* Summary */}
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{insight.summary}</p>

          {/* Evidence - Collapsible */}
          {insight.evidence.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>{expanded ? '−' : '+'} Evidence</span>
              </button>

              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-1 text-xs text-muted-foreground"
                >
                  {insight.evidence.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* Recommendation */}
          <p className="mt-2 text-xs text-muted-foreground italic">{insight.recommendation}</p>

          {/* Action Button */}
          {insight.actionUrl && insight.actionLabel && (
            <div className="mt-3">
              <Link href={insight.actionUrl}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                >
                  {insight.actionLabel}
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Confidence Badge */}
        {insight.confidence !== undefined && (
          <div className="flex-shrink-0 text-right">
            <span className="text-xs font-medium text-muted-foreground">
              {insight.confidence}%
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
