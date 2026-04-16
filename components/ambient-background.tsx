export function AmbientBackground() {
  const bands = [
    'lf-band lf-band--1',
    'lf-band lf-band--2',
    'lf-band lf-band--3',
    'lf-band lf-band--4',
    'lf-band lf-band--5',
    'lf-band lf-band--6',
    'lf-band lf-band--7',
  ]

  return (
    <div aria-hidden="true" className="lf-root">
      <div className="lf-base" />
      <div className="lf-grid" />
      <div className="lf-specks lf-specks--far" />
      <div className="lf-specks lf-specks--near" />

      <div className="lf-glow lf-glow--top" />
      <div className="lf-glow lf-glow--center" />
      <div className="lf-glow lf-glow--bottom" />

      {bands.map((band) => (
        <div key={band} className={band}>
          <div className="lf-band__shadow" />
          <div className="lf-band__line" />
          <div className="lf-band__dust" />
          <div className="lf-band__spark" />
        </div>
      ))}

      <div className="lf-vignette" />
    </div>
  )
}