/**
 * Premium hero wave background â€” layered silk-ribbon effect.
 *
 * 4 flowing S-curve ribbons sweep diagonally across the left portion of
 * the hero. Each ribbon is a closed bezier band (top edge + bottom edge)
 * with an SVG linearGradient that fades from white/light-navy near the
 * curl to transparent as it sweeps away â€” creating a glossy, dimensional
 * "silk ribbon" look with depth where ribbons overlap.
 *
 * Colours reference the brand palette hex values directly in SVG gradient
 * stops (CSS custom properties can't reach <stop> elements reliably
 * cross-browser). The values match the `brand` tokens in tailwind.config.
 *
 * @param {{ className?: string }} props
 */

export default function HeroWaveBackground({ className = '' }) {
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMinYMid slice"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        {/* Back ribbon gradient â€” very subtle, mostly transparent */}
        <linearGradient id="hero-ribbon-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a8b6d3" stopOpacity="0.5" />
          <stop offset="35%" stopColor="#768cb9" stopOpacity="0.35" />
          <stop offset="70%" stopColor="#1b3f8b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#163472" stopOpacity="0.08" />
        </linearGradient>

        {/* Second ribbon â€” moderate visibility */}
        <linearGradient id="hero-ribbon-2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="30%" stopColor="#cdd5e5" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#768cb9" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4965a2" stopOpacity="0.1" />
        </linearGradient>

        {/* Third ribbon â€” bolder, more visible */}
        <linearGradient id="hero-ribbon-3" x1="0%" y1="20%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="25%" stopColor="#a8b6d3" stopOpacity="0.5" />
          <stop offset="55%" stopColor="#4965a2" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#122a5c" stopOpacity="0.12" />
        </linearGradient>

        {/* Front ribbon â€” thinnest, brightest highlight */}
        <linearGradient id="hero-ribbon-4" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="40%" stopColor="#cdd5e5" stopOpacity="0.5" />
          <stop offset="75%" stopColor="#1b3f8b" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#163472" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* â”€â”€ Ribbon 1 (backmost): wide, sweeping S from upper-left â”€â”€ */}
      <path
        d={
          'M -80 60 ' +
          'C 120 -30, 340 -10, 520 100 ' +
          'C 700 210, 780 380, 960 340 ' +
          'C 1140 300, 1280 180, 1480 260 ' +
          'L 1480 400 ' +
          'C 1280 320, 1140 440, 960 480 ' +
          'C 780 520, 700 350, 520 240 ' +
          'C 340 130, 120 110, -80 200 Z'
        }
        fill="url(#hero-ribbon-1)"
      />

      {/* â”€â”€ Ribbon 2: offset right, flowing S â”€â”€ */}
      <path
        d={
          'M -60 220 ' +
          'C 140 130, 320 160, 480 270 ' +
          'C 640 380, 760 500, 940 450 ' +
          'C 1120 400, 1240 290, 1440 370 ' +
          'L 1440 470 ' +
          'C 1240 390, 1120 500, 940 550 ' +
          'C 760 600, 640 480, 480 370 ' +
          'C 320 260, 140 230, -60 320 Z'
        }
        fill="url(#hero-ribbon-2)"
      />

      {/* â”€â”€ Ribbon 3: mid-canvas, bolder â”€â”€ */}
      <path
        d={
          'M -40 400 ' +
          'C 160 330, 330 350, 490 440 ' +
          'C 650 530, 780 610, 950 560 ' +
          'C 1120 510, 1260 400, 1460 480 ' +
          'L 1460 550 ' +
          'C 1260 470, 1120 580, 950 630 ' +
          'C 780 680, 650 600, 490 510 ' +
          'C 330 420, 160 400, -40 470 Z'
        }
        fill="url(#hero-ribbon-3)"
      />

      {/* â”€â”€ Ribbon 4 (frontmost): thin, bright accent â”€â”€ */}
      <path
        d={
          'M -20 560 ' +
          'C 140 510, 300 520, 440 590 ' +
          'C 580 660, 700 720, 860 680 ' +
          'C 1020 640, 1160 560, 1340 620 ' +
          'L 1340 660 ' +
          'C 1160 600, 1020 680, 860 720 ' +
          'C 700 760, 580 700, 440 630 ' +
          'C 300 560, 140 550, -20 600 Z'
        }
        fill="url(#hero-ribbon-4)"
      />
    </svg>
  );
}
