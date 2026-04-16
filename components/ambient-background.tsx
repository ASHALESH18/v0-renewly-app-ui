type Stream = {
  id: string
  className: string
  accent?: 'gold' | 'cool'
  d: string
}

const streams: Stream[] = [
  {
    id: 's1',
    className: 'lf-stream--1',
    accent: 'gold',
    d: 'M -120 132 C 90 56, 250 206, 470 128 S 900 42, 1180 126 S 1500 210, 1760 120',
  },
  {
    id: 's2',
    className: 'lf-stream--2',
    accent: 'cool',
    d: 'M -140 118 C 120 176, 290 36, 520 118 S 930 196, 1180 112 S 1480 30, 1760 126',
  },
  {
    id: 's3',
    className: 'lf-stream--3',
    accent: 'gold',
    d: 'M -100 124 C 140 60, 320 188, 560 122 S 980 52, 1230 128 S 1520 206, 1760 118',
  },
  {
    id: 's4',
    className: 'lf-stream--4',
    accent: 'cool',
    d: 'M -120 114 C 110 188, 330 38, 560 120 S 980 192, 1230 112 S 1510 42, 1760 124',
  },
  {
    id: 's5',
    className: 'lf-stream--5',
    accent: 'gold',
    d: 'M -110 126 C 130 72, 340 188, 590 128 S 1020 58, 1270 122 S 1520 194, 1760 118',
  },
  {
    id: 's6',
    className: 'lf-stream--6',
    accent: 'cool',
    d: 'M -150 116 C 80 182, 280 54, 520 116 S 950 188, 1210 118 S 1510 46, 1760 126',
  },
  {
    id: 's7',
    className: 'lf-stream--7',
    accent: 'gold',
    d: 'M -120 122 C 120 76, 320 176, 560 124 S 980 66, 1240 120 S 1520 182, 1760 120',
  },
]

export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="lf-root">
      <div className="lf-base" />
      <div className="lf-grid" />
      <div className="lf-specks lf-specks--far" />
      <div className="lf-specks lf-specks--near" />

      <div className="lf-glow lf-glow--top" />
      <div className="lf-glow lf-glow--center" />
      <div className="lf-glow lf-glow--bottom" />

      {streams.map((stream) => (
        <div
          key={stream.id}
          className={`lf-stream ${stream.className} ${stream.accent === 'cool' ? 'lf-stream--cool' : ''
            }`}
        >
          <svg
            className="lf-stream__svg"
            viewBox="0 0 1600 240"
            preserveAspectRatio="none"
          >
            <path d={stream.d} className="lf-stream__shadow" />
            <path d={stream.d} className="lf-stream__line-soft" />
            <path d={stream.d} className="lf-stream__line" />
            <path d={stream.d} className="lf-stream__dust" />
            <path d={stream.d} className="lf-stream__spark" />
          </svg>
        </div>
      ))}

      <div className="lf-vignette" />
    </div>
  )
}