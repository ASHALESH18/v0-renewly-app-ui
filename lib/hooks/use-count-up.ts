'use client'

import { useEffect, useRef, useState } from 'react'

export function useCountUp(
  targetValue: number,
  duration: number = 2000,
  delay: number = 0
) {
  const [displayValue, setDisplayValue] = useState(0)
  const countUpRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const startCountUp = () => {
      let startValue = 0
      const startTime = Date.now()
      const startDelay = Date.now()

      const animate = () => {
        const now = Date.now()
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Easing function for smooth animation
        const easeOutQuad = 1 - Math.pow(1 - progress, 2)
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuad)

        setDisplayValue(currentValue)

        if (progress < 1) {
          countUpRef.current = setTimeout(animate, 16)
        }
      }

      countUpRef.current = setTimeout(animate, delay)
    }

    startCountUp()

    return () => {
      if (countUpRef.current) {
        clearTimeout(countUpRef.current)
      }
    }
  }, [targetValue, duration, delay])

  return displayValue
}
