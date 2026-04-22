/**
 * AmbientBackground
 *
 * Theme-aware static background layer. Lives behind all app chrome
 * inside the root `relative isolate` stacking context in `app/layout.tsx`,
 * so it can NEVER sit above interactive UI (sidebar, logo, buttons).
 *
 * Three behaviours switched purely via CSS on the `[data-theme]`
 * attribute (see the `.ambient-atmosphere-*` rules in globals.css):
 *
 *  - light / dark: a very subtle gold vignette over `--background`
 *  - glass:        a luminous blue / lavender atmosphere + soft grain,
 *                  visible through the translucent cards and sidebar
 *
 * Because everything here is rendered as a child of a
 * `pointer-events-none` wrapper, no layer in this tree can ever
 * capture a click — which is how we keep the sidebar and logo
 * fully clickable in all three themes.
 */
export function AmbientBackground() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* 1. Base fill — uses the theme's --background token */}
      <div className="absolute inset-0 bg-background" />

      {/* 2. Default ambient (Light/Dark). Hidden under Glass by CSS. */}
      <div className="ambient-atmosphere-default" />

      {/* 3. Glass ambient — luminous blue/lavender atmosphere.
             Only visible when [data-theme="glass"]. */}
      <div className="ambient-atmosphere-glass" />

      {/* 4. Subtle grain — only active in Glass to add premium texture */}
      <div className="ambient-grain" />
    </div>
  )
}
