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
    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {chips.map((chip, index) => {
        const isSelected = selectedChip === chip.id
        
        return (
          <motion.button
            key={chip.id}
            variants={chipVariants}
            initial="initial"
            animate="animate"
            whileTap="tap"
            whileHover={{ scale: 1.05, y: -2 }}
            custom={index}
            transition={{ ...springs.snappy, delay: index * 0.03 }}
            onClick={() => onChipSelect(chip.id)}
            className={cn(
              'relative px-5 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border group',
              isSelected
                ? 'bg-gradient-to-r from-gold via-gold/95 to-gold/90 text-obsidian border-gold/60 shadow-[0_8px_24px_-4px_rgba(199,163,106,0.5),0_0_0_1px_rgba(199,163,106,0.2)]'
                : 'bg-card/70 backdrop-blur-sm border-border text-muted-foreground hover:text-foreground hover:border-gold/40 hover:bg-gold/8 hover:shadow-[0_4px_16px_-4px_rgba(199,163,106,0.2)]'
            )}
          >
            {/* Glow effect when selected */}
            {isSelected && (
              <motion.div
                className="absolute -inset-1 rounded-2xl bg-gold/30 blur-lg -z-10"
                animate={{ opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            {chip.label}
            {chip.count !== undefined && (
              <span className={cn(
                'ml-2 px-2 py-0.5 rounded-lg text-xs font-bold',
                isSelected ? 'bg-obsidian/25 text-obsidian' : 'bg-muted text-muted-foreground'
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
      'relative inline-flex p-1.5 rounded-2xl bg-card/80 border border-gold/15 backdrop-blur-xl shadow-[0_4px_16px_-4px_rgba(87,63,38,0.1)]',
      fullWidth && 'w-full'
    )}>
      {/* Subtle inner highlight */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
      
      {segments.map((segment) => {
        const isSelected = selectedSegment === segment.id
        
        return (
          <motion.button
            key={segment.id}
            onClick={() => onSegmentSelect(segment.id)}
            whileHover={!isSelected ? { backgroundColor: 'rgba(199,163,106,0.08)' } : undefined}
            whileTap={{ scale: 0.96 }}
            className={cn(
              'relative px-5 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer',
              fullWidth && 'flex-1',
              isSelected ? 'text-obsidian' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isSelected && (
              <motion.div
                layoutId="segmentBg"
                className="absolute inset-0 bg-gradient-to-r from-gold via-gold/95 to-gold/90 rounded-xl shadow-[0_4px_16px_-4px_rgba(199,163,106,0.5),0_0_0_1px_rgba(199,163,106,0.2)]"
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
