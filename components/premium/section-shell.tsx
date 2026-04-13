'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { FloatingGlows } from './glow-orb'

interface SectionShellProps {
  children: React.ReactNode
  id?: string
  variant?: 'default' | 'alternate' | 'dark' | 'hero'
  className?: string
  innerClassName?: string
  showGlows?: boolean
  fullWidth?: boolean
}

export function SectionShell({
  children,
  id,
  variant = 'default',
  className = '',
  innerClassName = '',
  showGlows = true,
  fullWidth = false,
}: SectionShellProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const variantStyles = {
    default: 'bg-background',
    alternate: 'bg-card dark:bg-graphite',
    dark: 'bg-graphite dark:bg-obsidian',
    hero: 'bg-background',
  }

  return (
    <section
      id={id}
      ref={ref}
      className={cn(
        'relative overflow-hidden scroll-mt-24',
        variantStyles[variant],
        className
      )}
    >
      {/* Ambient background glows */}
      {showGlows && <FloatingGlows variant={variant === 'hero' ? 'hero' : 'section'} />}

      {/* Top separator line with glow */}
      {variant !== 'hero' && (
        <div className="absolute top-0 left-0 right-0 h-px">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border to-transparent" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/20 to-transparent"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Content wrapper */}
      <div className={cn(
        'relative z-10',
        !fullWidth && 'max-w-7xl mx-auto px-4 lg:px-6',
        innerClassName
      )}>
        {children}
      </div>
    </section>
  )
}

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  titleHighlight?: string
  description?: string
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeader({
  eyebrow,
  title,
  titleHighlight,
  description,
  align = 'center',
  className = '',
}: SectionHeaderProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
      animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={cn(
        'mb-12 lg:mb-16',
        align === 'center' && 'text-center',
        className
      )}
    >
      {eyebrow && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-gold text-sm font-medium tracking-wide uppercase mb-4"
        >
          {eyebrow}
        </motion.p>
      )}
      
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight leading-tight">
        {title}
        {titleHighlight && (
          <>
            <br className="hidden sm:block" />
            <span className="text-gold-gradient">{titleHighlight}</span>
          </>
        )}
      </h2>
      
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.2 }}
          className={cn(
            'mt-4 text-platinum leading-relaxed',
            align === 'center' && 'max-w-2xl mx-auto'
          )}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  )
}
