// Hand-drawn pixel icons used in place of emoji throughout the app.
// Color emoji glyphs have wildly inconsistent metrics across
// platforms/fonts — the coffee-break vote value rendered at a different
// visual size in nearly every place it appeared until it was replaced
// with a self-drawn icon here. These are all sized in em, so they scale
// predictably with whatever text surrounds them, the same way a text
// character would, instead of depending on a platform's emoji font.

const commonProps = {
  viewBox: '0 0 16 16',
  width: '1em',
  height: '1em',
  'aria-hidden': true,
} as const

export function CoffeeIcon() {
  return (
    <svg {...commonProps} shapeRendering="crispEdges" fill="currentColor">
      <rect x="5" y="1" width="1" height="3" />
      <rect x="8" y="0" width="1" height="4" />
      <rect x="2" y="6" width="9" height="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="8" width="3" height="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1" y="14" width="12" height="1" />
    </svg>
  )
}

export function EyeIcon() {
  return (
    <svg {...commonProps}>
      <path d="M1 8 L5 4 H11 L15 8 L11 12 H5 Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
    </svg>
  )
}

export function MonitorIcon() {
  return (
    <svg {...commonProps} shapeRendering="crispEdges" fill="currentColor">
      <rect x="1" y="2" width="14" height="9" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="6" y="12" width="4" height="1" />
      <rect x="4" y="14" width="8" height="1" />
    </svg>
  )
}

export function LockIcon() {
  return (
    <svg {...commonProps} shapeRendering="crispEdges" fill="currentColor">
      <rect x="5" y="1" width="6" height="1" />
      <rect x="4" y="2" width="1" height="3" />
      <rect x="11" y="2" width="1" height="3" />
      <rect x="3" y="6" width="10" height="9" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="7" y="9" width="2" height="3" />
    </svg>
  )
}

export function CrownIcon() {
  return (
    <svg {...commonProps} shapeRendering="crispEdges" fill="currentColor">
      <rect x="1" y="11" width="14" height="2" />
      <rect x="1" y="6" width="2" height="5" />
      <rect x="7" y="2" width="2" height="9" />
      <rect x="13" y="6" width="2" height="5" />
      <rect x="4" y="8" width="2" height="3" />
      <rect x="10" y="8" width="2" height="3" />
    </svg>
  )
}

export function StarIcon() {
  return (
    <svg {...commonProps} shapeRendering="crispEdges" fill="currentColor">
      <rect x="7" y="1" width="2" height="4" />
      <rect x="7" y="11" width="2" height="4" />
      <rect x="1" y="7" width="4" height="2" />
      <rect x="11" y="7" width="4" height="2" />
      <rect x="6" y="6" width="4" height="4" />
      <rect x="3" y="3" width="2" height="2" />
      <rect x="11" y="3" width="2" height="2" />
      <rect x="3" y="11" width="2" height="2" />
      <rect x="11" y="11" width="2" height="2" />
    </svg>
  )
}

export function CheckIcon() {
  return (
    <svg {...commonProps} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8 L6.5 12 L13 3" />
    </svg>
  )
}

export function CopyIcon() {
  return (
    <svg {...commonProps} shapeRendering="crispEdges">
      <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect
        x="6"
        y="6"
        width="8"
        height="8"
        fill="var(--bg-inset)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function RefreshIcon() {
  return (
    <svg
      {...commonProps}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
     
    >
      <path d="M13 3 v4 h-4" />
      <path d="M3 13 v-4 h4" />
      <path d="M13 7a5.5 5.5 0 0 0-9.5-3.5L3 5" />
      <path d="M3 9a5.5 5.5 0 0 0 9.5 3.5L13 11" />
    </svg>
  )
}
