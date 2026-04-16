export function AmbientBackground() {
  const bands = [
    'ambient-band ambient-band--01',
    'ambient-band ambient-band--02',
    'ambient-band ambient-band--03',
    'ambient-band ambient-band--04',
    'ambient-band ambient-band--05',
    'ambient-band ambient-band--06',
  ]

  return (
    <div aria-hidden="true" className="ambient-root">
      <div className="ambient-base" />
      <div className="ambient-grid" />
      <div className="ambient-specks" />
      <div className="ambient-center-glow" />
      <div className="ambient-lower-glow" />

      {bands.map((className) => (
        <div key={className} className={className}>
          <div className="ambient-band__core" />
          <div className="ambient-band__dust" />
          <div className="ambient-band__bokeh" />
        </div>
      ))}

      <div className="ambient-vignette" />
    </div>
  )
}