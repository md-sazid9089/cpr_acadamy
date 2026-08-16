/**
 * Decorative background elements.
 *
 * Usage: wrap them in an absolutely-positioned container with `text-<color>
 * opacity-[…]`.  The elements themselves are colourless — they inherit
 * `currentColor` so the parent controls hue and opacity in one place.
 *
 * Every export below carries `aria-hidden="true"` and ignores pointer events,
 * so they never interfere with a11y or click targets.
 */
export { default as DotMatrix }  from './DotMatrix.jsx';
export { default as EcgLine }    from './EcgLine.jsx';
export { default as RadialGlow } from './RadialGlow.jsx';
