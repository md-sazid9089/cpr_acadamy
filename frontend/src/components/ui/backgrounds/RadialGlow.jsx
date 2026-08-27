/**
 * Two soft off-centre glows — one top-left, one bottom-right — used to keep
 * large flat sections from reading as dead space. Colourless: both gradients
 * resolve `currentColor` from the parent wrapper.
 */
export default function RadialGlow({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{
        backgroundImage:
          'radial-gradient(ellipse 80% 50% at 15% 0%, currentColor, transparent 70%),' +
          'radial-gradient(ellipse 60% 50% at 85% 100%, currentColor, transparent 70%)',
      }}
    />
  );
}
