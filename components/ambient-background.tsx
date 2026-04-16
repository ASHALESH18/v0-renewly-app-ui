export function AmbientBackground() {
  const streams = [
    'lux-ambient-stream lux-ambient-stream--a',
    'lux-ambient-stream lux-ambient-stream--b',
    'lux-ambient-stream lux-ambient-stream--c',
    'lux-ambient-stream lux-ambient-stream--d',
    'lux-ambient-stream lux-ambient-stream--e',
    'lux-ambient-stream lux-ambient-stream--f',
    'lux-ambient-stream lux-ambient-stream--g',
    'lux-ambient-stream lux-ambient-stream--h',
  ]

  return (
    <div aria-hidden="true" className="lux-ambient-root">
      <div className="lux-ambient-base" />
      <div className="lux-ambient-grid" />
      <div className="lux-ambient-specks lux-ambient-specks--far" />
      <div className="lux-ambient-specks lux-ambient-specks--near" />
      <div className="lux-ambient-center-glow" />
      <div className="lux-ambient-edge-glow lux-ambient-edge-glow--top" />
      <div className="lux-ambient-edge-glow lux-ambient-edge-glow--bottom" />

      {streams.map((stream) => (
        <div key={stream} className={stream}>
          <div className="lux-ambient-stream__shadow" />
          <div className="lux-ambient-stream__core" />
          <div className="lux-ambient-stream__dust" />
          <div className="lux-ambient-stream__sparkles" />
        </div>
      ))}

      <div className="lux-ambient-vignette" />
    </div>
  )
}