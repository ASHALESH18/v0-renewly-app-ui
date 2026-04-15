'use client'

export function AmbientBackground() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div className="ambient-base" />

      <div className="ambient-ribbon ambient-ribbon--gold animate-ambient-flow-gold" />
      <div className="ambient-ribbon ambient-ribbon--emerald animate-ambient-flow-emerald" />
      <div className="ambient-ribbon ambient-ribbon--platinum animate-ambient-flow-platinum" />

      <div className="ambient-glow ambient-glow--center animate-ambient-breathe-center" />
      <div className="ambient-glow ambient-glow--edge animate-ambient-breathe-edge" />

      <div className="ambient-texture" />
      <div className="ambient-vignette" />
    </div>
  )
}