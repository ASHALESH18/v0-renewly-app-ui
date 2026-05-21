'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { Insight } from '@/lib/insights/insight-types'
import { InsightCard } from './insight-card'
import { Sparkles } from 'lucide-react'

interface InsightBoardProps {
  insights: Insight[]
  maxInsights?: number
  category?: string
  emptyMessage?: string
  title?: string
  showTitle?: boolean
}

export function InsightBoard({
  insights,
  maxInsights = 5,
  category,
  emptyMessage = 'Renewly will surface insights as your subscription history grows.',
  title = 'Renewly Intelligence',
  showTitle = true,
}: InsightBoardProps) {
  // Filter by category if specified
  const filteredInsights = category
    ? insights.filter((i) => i.category === category)
    : insights

  // Limit to max insights
  const displayedInsights = filteredInsights.slice(0, maxInsights)

  if (displayedInsights.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border/30 bg-card/30 p-6 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {showTitle && (
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-gold" />
          <h3 className="font-semibold text-foreground text-lg">{title}</h3>
          {filteredInsights.length > maxInsights && (
            <span className="text-xs text-muted-foreground ml-auto">
              {maxInsights} of {filteredInsights.length}
            </span>
          )}
        </div>
      )}

      <div className="space-y-3">
        {displayedInsights.map((insight, index) => (
          <InsightCard key={insight.id} insight={insight} index={index} />
        ))}
      </div>

      {filteredInsights.length > maxInsights && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          +{filteredInsights.length - maxInsights} more insight{filteredInsights.length - maxInsights !== 1 ? 's' : ''}
        </p>
      )}
    </motion.div>
  )
}
