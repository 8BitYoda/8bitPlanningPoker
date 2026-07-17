// A hand-drawn pixel coffee cup, used in place of the "☕" emoji everywhere
// a vote value is displayed. Color emoji glyphs have wildly inconsistent
// metrics across platforms/fonts (this one rendered at a different visual
// size in nearly every context it appeared in), so a self-drawn icon sized
// in em — which scales predictably with the surrounding text — sidesteps
// the problem entirely instead of chasing a font-specific magic number.
export function CoffeeIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      shapeRendering="crispEdges"
      fill="currentColor"
      role="img"
      aria-label="coffee break"
    >
      <rect x="5" y="1" width="1" height="3" />
      <rect x="8" y="0" width="1" height="4" />
      <rect x="2" y="6" width="9" height="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="8" width="3" height="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1" y="14" width="12" height="1" />
    </svg>
  )
}
