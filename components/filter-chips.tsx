'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { chipVariants, springs } from './motion'

interface FilterChip {
  id: string
  label: string
  count?: number
}

interface FilterChipsProps {
  chips: FilterChip[]
  selectedChip: string
  onChipSelect: (chipId: string) => void
}

export function FilterChips({ chips, selectedChip, onChipSelect }: FilterChipsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {chips.map((chip, index) => {
        const isSelected = selectedChip === chip.id
        
        return (
          <motion.button
            key={chip.id}
            variants={chipVariants}
            initial="initial"
            animate="animate"
            whileTap="tap"
            whileHover={{ scale: 1.02 }}
            custom={index}
            transition={{ ...springs.snappy, delay: index * 0.03 }}
            onClick={() => onChipSelect(chip.id)}
            className={cn(
              'relative px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer border',
              isSelected
                ? 'bg-gradient-to-r from-gold to-gold/90 text-obsidian border-gold/50 shadow-[0_4px_12px_-4px_rgba(199,163,106,0.4)]'
                : 'bg-card/60 border-border text-muted-foreground hover:text-foreground hover:border-gold/30 hover:bg-gold/5'
            )}
          >
            {chip.label}
            {chip.count !== undefined && (
              <span className={cn(
                'ml-1.5 px-1.5 py-0.5 rounded-md text-xs',
                isSelected ? 'bg-obsidian/20 text-obsidian' : 'bg-muted text-muted-foreground'
              )}>
                {chip.count}
              </span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

// Segmented control component
interface SegmentedControlProps {
  segments: { id: string; label: string }[]
  selectedSegment: string
  onSegmentSelect: (segmentId: string) => void
  fullWidth?: boolean
}

export function SegmentedControl({
  segments,
  selectedSegment,
  onSegmentSelect,
  fullWidth = false,
}: SegmentedControlProps) {
  return (
    <div className={cn(
      'inline-flex p-1 rounded-xl bg-card/60 border border-border backdrop-blur-sm',
      fullWidth && 'w-full'
    )}>
      {segments.map((segment) => {
        const isSelected = selectedSegment === segment.id
        
        return (
          <motion.button
            key={segment.id}
            onClick={() => onSegmentSelect(segment.id)}
            whileHover={!isSelected ? { backgroundColor: 'rgba(199,163,106,0.05)' } : undefined}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'relative px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer',
              fullWidth && 'flex-1',
              isSelected ? 'text-obsidian' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isSelected && (
              <motion.div
                layoutId="segmentBg"
                className="absolute inset-0 bg-gradient-to-r from-gold to-gold/90 rounded-lg shadow-[0_2px_8px_-2px_rgba(199,163,106,0.4)]"
                transition={springs.snappy}
              />
            )}
            <span className="relative z-10">{segment.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

// Toggle switch with animation
interface ToggleProps {
  enabled: boolean
  onToggle: () => void
  label?: string
  description?: string
}

export function Toggle({ enabled, onToggle, label, description }: ToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between gap-4 w-full py-2 cursor-pointer"
    >
      {(label || description) && (
        <div className="flex-1 text-left">
          {label && <p className="font-medium text-foreground">{label}</p>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      
      <motion.div
        className={cn(
          'w-12 h-7 rounded-full p-1 transition-colors',
          enabled ? 'bg-gold' : 'bg-muted'
        )}
      >
        <motion.div
          layout
          transition={springs.snappy}
          className={cn(
            'w-5 h-5 rounded-full bg-white shadow-sm',
            enabled && 'ml-5'
          )}
        />
      </motion.div>
    </button>
  )
}

// Category badge
interface CategoryBadgeProps {
  category: string
  color?: string
  size?: 'sm' | 'md'
}

export function CategoryBadge({ category, color, size = 'sm' }: CategoryBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
  }

  return (
    <span 
      className={cn(
        'rounded-full font-medium',
        sizeClasses[size],
        color ? 'text-white' : 'bg-muted text-muted-foreground'
      )}
      style={color ? { backgroundColor: `${color}20`, color } : undefined}
    >
      {category}
    </span>
  )
}
