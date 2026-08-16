/**
 * Decorative ECG trace, stretched to fill its wrapper.
 *
 * Colourless by design: `currentColor` means the parent wrapper decides the
 * tint and opacity. See `backgrounds/index.js` for the wrapper pattern.
 */
export default function EcgLine({ className = '' }) {
  return (
    <svg
      viewBox="0 0 400 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M 0 50 H 40 Q 47 38 54 50 H 70 L 76 60 L 84 14 L 92 76 L 100 50
           H 128 Q 142 34 156 50 H 200
           H 240 Q 247 38 254 50 H 270 L 276 60 L 284 14 L 292 76 L 300 50
           H 328 Q 342 34 356 50 H 400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
