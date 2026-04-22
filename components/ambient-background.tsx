'use client'

/**
 * Static Premium Dark Background
 * 
 * Replaced animated ambient background with a static premium dark background.
 * Removes all full-screen animations (particles, waves, glows, breathe effects)
 * while keeping element-level animations for cards, sheets, and buttons.
 * 
 * This improves perceived speed and smoothness of the app.
 */
export function AmbientBackground() {
  return (
    <div 
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Deep graphite base - premium dark background */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Optional very subtle static radial gradient for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 20% 50%, rgba(212, 176, 112, 0.03) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(42, 85, 72, 0.02) 0%, transparent 50%)',
        }}
      />
      
      {/* Subtle texture overlay for premium feel */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  )
}
