/**
 * Hero ribbon background — a stack of translucent S-curve ribbons over a soft
 * radial glow, pinned to the left half of the hero so the poster carousel on the
 * right stays on a clean surface.
 *
 * Everything paints with `currentColor`, so the wrapper's Tailwind text colour
 * sets the tint; the gradients carry the opacity ramp.
 *
 * @param {{ className?: string }} props
 */

/**
 * Builds one closed ribbon band from a serpentine centreline.
 *
 * The centreline sweeps right → left → right (the S), and each cubic joins the
 * next with a reflected control point, so there is no kink where the segments
 * meet. The band is closed by walking the same curve back with every x shifted
 * by `width`, which keeps the two edges parallel for a curve this steep.
 *
 * @param {number} x0    Left edge of the band at the top of the viewBox.
 * @param {number} width Band thickness.
 */
function ribbonPath(x0, width) {
  const a = (dx) => x0 + dx; // outward edge
  const b = (dx) => x0 + dx + width; // return edge

  return [
    `M ${a(0)},-40`,
    // Sweep right
    `C ${a(40)},120 ${a(320)},140 ${a(300)},320`,
    // Back left — C1 mirrors the previous C2 about the shared anchor
    `C ${a(280)},500 ${a(20)},480 ${a(60)},660`,
    // Right again, closing the S
    `C ${a(100)},840 ${a(320)},820 ${a(330)},1000`,
    // Return edge, same curve walked upward
    `L ${b(330)},1000`,
    `C ${b(320)},820 ${b(100)},840 ${b(60)},660`,
    `C ${b(20)},480 ${b(280)},500 ${b(300)},320`,
    `C ${b(320)},140 ${b(40)},120 ${b(0)},-40`,
    'Z',
  ].join(' ');
}

/** Back-to-front: wide and faint behind, narrow and bright in front. */
const RIBBONS = [
  { d: ribbonPath(-70, 150), fill: 'url(#cpr-ribbon-4)' },
  { d: ribbonPath(30, 120), fill: 'url(#cpr-ribbon-1)' },
  { d: ribbonPath(140, 74), fill: 'url(#cpr-ribbon-2)' },
  { d: ribbonPath(250, 26), fill: 'url(#cpr-ribbon-3)' },
];

export default function HeroRibbonBackground({ className = '' }) {
  return (
    <div className={`relative ${className}`}>
      {/* Desktop: ribbons confined to the left half. `xMinYMid slice` anchors
          the artwork to the left edge so the S stays put as the hero resizes. */}
      <div className="absolute inset-y-0 left-0 hidden w-[58%] overflow-hidden text-brand-600 md:block lg:w-1/2 dark:text-brand-400">
        <svg
          className="h-full w-full"
          viewBox="0 0 640 960"
          preserveAspectRatio="xMinYMid slice"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            {/* Soft glow anchored top-left. */}
            <radialGradient id="cpr-glow" gradientUnits="userSpaceOnUse" cx="120" cy="140" r="500">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.16" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>

            {/* Each ribbon fades top-to-bottom so the shapes dissolve rather
                than ending on a hard edge at the section boundary. */}
            <linearGradient id="cpr-ribbon-1" gradientUnits="userSpaceOnUse" x1="120" y1="0" x2="300" y2="900">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.20" />
              <stop offset="0.40" stopColor="currentColor" stopOpacity="0.09" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="cpr-ribbon-2" gradientUnits="userSpaceOnUse" x1="240" y1="0" x2="380" y2="880">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.42" />
              <stop offset="0.38" stopColor="currentColor" stopOpacity="0.16" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="cpr-ribbon-3" gradientUnits="userSpaceOnUse" x1="380" y1="0" x2="460" y2="820">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.70" />
              <stop offset="0.30" stopColor="currentColor" stopOpacity="0.26" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="cpr-ribbon-4" gradientUnits="userSpaceOnUse" x1="20" y1="0" x2="180" y2="900">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.13" />
              <stop offset="0.45" stopColor="currentColor" stopOpacity="0.05" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="640" height="960" fill="url(#cpr-glow)" />

          {RIBBONS.map((ribbon) => (
            <path key={ribbon.fill} d={ribbon.d} fill={ribbon.fill} />
          ))}
        </svg>
      </div>

      {/* Mobile: a flat gradient instead of four layered paths. */}
      <div className="h-full w-full bg-gradient-to-br from-brand-100 via-white to-white md:hidden dark:from-brand-950 dark:via-surface-dark dark:to-surface-dark" />
    </div>
  );
}
