'use client'

import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

/**
 * Scroll-based reveal animation - elements fade and slide in as user scrolls into view
 */
interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['0 1', '1.33 1'],
  })

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1])
  const y = useTransform(scrollYProgress, [0, 1], [40, 0])

  return (
    <motion.div ref={ref} style={{ opacity, y }} className={className}>
      {children}
    </motion.div>
  )
}

/**
 * Scroll-based parallax effect - subtle depth movement
 */
interface ScrollParallaxProps {
  children: ReactNode
  offset?: number
  className?: string
}

export function ScrollParallax({ children, offset = 50, className }: ScrollParallaxProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['0 1', '1.33 1'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset])

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  )
}

/**
 * Scroll-based opacity fade - element fades based on scroll progress
 */
interface ScrollFadeProps {
  children: ReactNode
  fromOpacity?: number
  toOpacity?: number
  className?: string
}

export function ScrollFade({
  children,
  fromOpacity = 0,
  toOpacity = 1,
  className,
}: ScrollFadeProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['0 1', '1.33 1'],
  })

  const opacity = useTransform(scrollYProgress, [0, 1], [fromOpacity, toOpacity])

  return (
    <motion.div ref={ref} style={{ opacity }} className={className}>
      {children}
    </motion.div>
  )
}

/**
 * Scroll-based scale animation - element scales as user scrolls
 */
interface ScrollScaleProps {
  children: ReactNode
  fromScale?: number
  toScale?: number
  className?: string
}

export function ScrollScale({
  children,
  fromScale = 0.8,
  toScale = 1,
  className,
}: ScrollScaleProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['0 1', '1.33 1'],
  })

  const scale = useTransform(scrollYProgress, [0, 1], [fromScale, toScale])

  return (
    <motion.div ref={ref} style={{ scale }} className={className}>
      {children}
    </motion.div>
  )
}

/**
 * Scroll-triggered text reveal - text slides in and fades as user scrolls
 */
interface ScrollTextRevealProps {
  text: string
  className?: string
}

export function ScrollTextReveal({ text, className }: ScrollTextRevealProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['0 0.8', '1 1'],
  })

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1])
  const x = useTransform(scrollYProgress, [0, 1], [100, 0])

  return (
    <motion.div
      ref={ref}
      style={{ opacity, x }}
      className={className}
    >
      {text}
    </motion.div>
  )
}

/**
 * Stagger text reveal on scroll - each word reveals individually
 */
interface StaggerTextRevealProps {
  text: string
  className?: string
  wordClassName?: string
}

export function StaggerTextReveal({
  text,
  className,
  wordClassName,
}: StaggerTextRevealProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['0 0.8', '1 1'],
  })

  const words = text.split(' ')

  return (
    <motion.div ref={ref} className={className}>
      {words.map((word, i) => {
        const start = i / words.length
        const end = (i + 1) / words.length
        const wordOpacity = useTransform(
          scrollYProgress,
          [start, end],
          [0, 1]
        )

        return (
          <motion.span
            key={i}
            style={{ opacity: wordOpacity }}
            className={wordClassName}
          >
            {word}{' '}
          </motion.span>
        )
      })}
    </motion.div>
  )
}

/**
 * Scroll-based gradient animation - background gradient shifts based on scroll
 */
interface ScrollGradientProps {
  children: ReactNode
  gradientFrom?: string
  gradientTo?: string
  className?: string
}

export function ScrollGradient({
  children,
  gradientFrom = '#C7A36A',
  gradientTo = '#1a1a1a',
  className,
}: ScrollGradientProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['0 1', '1.33 1'],
  })

  const backgroundGradient = useMotionTemplate`
    linear-gradient(
      to bottom,
      hsl(from ${gradientFrom} h s l / ${useTransform(
        scrollYProgress,
        [0, 1],
        [0.1, 0.5]
      )}),
      ${gradientTo}
    )
  `

  return (
    <motion.div ref={ref} style={{ backgroundImage: backgroundGradient }} className={className}>
      {children}
    </motion.div>
  )
}
