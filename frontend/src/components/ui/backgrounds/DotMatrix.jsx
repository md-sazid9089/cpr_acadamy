/**
 * Decorative dot grid. Not an SVG — a repeating radial-gradient is cheaper than
 * hundreds of circle nodes. Colourless: the dots inherit `currentColor` from the
 * parent wrapper.
 *
 * @param {{ className?: string, fade?: boolean }} props
 * @param {boolean} [props.fade=true] Fade the grid out toward the bottom edge so
 *   it doesn't collide with content lower in the section.
 */
export default function DotMatrix({ className = '', fade = true }) {
  const style = {
    backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  };
  if (fade) {
    style.maskImage =
      'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)';
    style.WebkitMaskImage = style.maskImage;
  }
  return (
    <div
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    />
  );
}
