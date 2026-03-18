/**
 * Premium avatar generation using deterministic algorithms
 * Same user always gets the same avatar, no external APIs needed
 */

import { hash } from './hash-utils'

export interface AvatarConfig {
  seed: string
  size?: number
}

/**
 * Generate a premium avatar using a hash-based deterministic approach
 * Returns an SVG URL data string
 */
export function generateAvatar(config: AvatarConfig): string {
  const { seed, size = 256 } = config
  
  // Use hash to generate consistent but varied colors and patterns
  const seedHash = hash(seed)
  
  // Extract color components from hash (use premium color palette)
  const premiumColors = [
    { bg: '#1a1a1a', accent: '#d4af37' },  // Gold on obsidian
    { bg: '#0f1419', accent: '#c0a080' },  // Champagne on dark
    { bg: '#1a1a24', accent: '#8b7355' },  // Bronze on slate
    { bg: '#111419', accent: '#9d84b7' },  // Purple on dark
    { bg: '#1a1514', accent: '#a8876f' },  // Warm bronze
  ]
  
  const colorIndex = Math.abs(seedHash) % premiumColors.length
  const colors = premiumColors[colorIndex]
  
  // Generate pattern type (0-3)
  const pattern = Math.abs(Math.floor(seedHash / premiumColors.length)) % 4
  
  return generateSVGAvatar({
    seed,
    size,
    bgColor: colors.bg,
    accentColor: colors.accent,
    pattern,
  })
}

function generateSVGAvatar(options: {
  seed: string
  size: number
  bgColor: string
  accentColor: string
  pattern: number
}): string {
  const { seed, size, bgColor, accentColor, pattern } = options
  
  // Generate pattern based on seed
  const seedHash = hash(seed)
  const elements = generatePatternElements(seedHash, pattern, accentColor, size)
  
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad_${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${bgColor};stop-opacity:0.95" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="${size}" height="${size}" fill="url(#grad_${seed})" />
      
      <!-- Pattern elements -->
      ${elements}
      
      <!-- Subtle border -->
      <rect width="${size}" height="${size}" fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.3" />
    </svg>
  `
  
  const encodedSvg = encodeURIComponent(svg.trim())
  return `data:image/svg+xml,${encodedSvg}`
}

function generatePatternElements(
  seed: number,
  pattern: number,
  accentColor: string,
  size: number
): string {
  const centerX = size / 2
  const centerY = size / 2
  const baseRadius = size / 6
  
  switch (pattern) {
    case 0: // Geometric circles
      return generateGeometricCircles(seed, centerX, centerY, baseRadius, accentColor, size)
    case 1: // Abstract waves
      return generateAbstractWaves(seed, accentColor, size)
    case 2: // Layered shapes
      return generateLayeredShapes(seed, centerX, centerY, baseRadius, accentColor, size)
    case 3: // Orbital rings
      return generateOrbitalRings(seed, centerX, centerY, baseRadius, accentColor, size)
    default:
      return ''
  }
}

function generateGeometricCircles(
  seed: number,
  centerX: number,
  centerY: number,
  radius: number,
  color: string,
  size: number
): string {
  const opacities = [0.8, 0.5, 0.3]
  const scales = [1, 0.6, 0.3]
  
  return opacities
    .map((op, idx) => {
      const r = radius * scales[idx]
      const angle = (seed + idx * 120) * (Math.PI / 180)
      const offset = radius * 0.5
      return `<circle cx="${centerX + Math.cos(angle) * offset}" cy="${centerY + Math.sin(angle) * offset}" r="${r}" fill="${color}" opacity="${op}" />`
    })
    .join('\n')
}

function generateAbstractWaves(
  seed: number,
  color: string,
  size: number
): string {
  const waves = []
  const waveCount = 3
  
  for (let i = 0; i < waveCount; i++) {
    const offset = (seed + i * 100) % 360
    const yPos = (size / waveCount) * i + size / 6
    const amplitude = size / 12
    
    let pathData = `M 0,${yPos}`
    for (let x = 0; x <= size; x += size / 20) {
      const y = yPos + Math.sin(((x / size) * Math.PI * 2 + offset * Math.PI / 180)) * amplitude
      pathData += ` L ${x},${y}`
    }
    pathData += ` L ${size},${size} L 0,${size} Z`
    
    const opacity = 0.3 + (i * 0.2)
    waves.push(`<path d="${pathData}" fill="${color}" opacity="${opacity}" />`)
  }
  
  return waves.join('\n')
}

function generateLayeredShapes(
  seed: number,
  centerX: number,
  centerY: number,
  radius: number,
  color: string,
  size: number
): string {
  const shapes = []
  const layerCount = 4
  
  for (let i = 0; i < layerCount; i++) {
    const angle = (seed + i * 90) * (Math.PI / 180)
    const r = radius * (1 - i * 0.2)
    const x1 = centerX + Math.cos(angle) * r
    const y1 = centerY + Math.sin(angle) * r
    const x2 = centerX + Math.cos(angle + Math.PI / 2) * r
    const y2 = centerY + Math.sin(angle + Math.PI / 2) * r
    
    shapes.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${2 + i}" opacity="${0.8 - i * 0.15}" />`)
  }
  
  return shapes.join('\n')
}

function generateOrbitalRings(
  seed: number,
  centerX: number,
  centerY: number,
  radius: number,
  color: string,
  size: number
): string {
  const rings = []
  const ringCount = 3
  
  for (let i = 0; i < ringCount; i++) {
    const r = radius * (i + 1)
    const opacity = 0.8 - i * 0.25
    rings.push(`<circle cx="${centerX}" cy="${centerY}" r="${r}" fill="none" stroke="${color}" stroke-width="1.5" opacity="${opacity}" />`)
  }
  
  // Add orbital dots
  for (let i = 0; i < 3; i++) {
    const angle = ((seed + i * 120) * Math.PI / 180)
    const r = radius * 2
    const x = centerX + Math.cos(angle) * r
    const y = centerY + Math.sin(angle) * r
    rings.push(`<circle cx="${x}" cy="${y}" r="3" fill="${color}" opacity="0.6" />`)
  }
  
  return rings.join('\n')
}
