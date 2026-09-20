/**
 * A progressive image wrapper for bundled photos. The original `src` remains
 * the compatibility fallback while modern browsers choose the supplied WebP
 * candidates before downloading it.
 */
export default function ResponsiveImage({ webpSrcSet, sizes = '100vw', src, alt, ...props }) {
  if (!webpSrcSet) return <img src={src} alt={alt} {...props} />;

  return (
    <picture className="contents">
      <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
      <img src={src} alt={alt} {...props} />
    </picture>
  );
}

/** Build the derivative convention used by `images:optimize` for local photos. */
export function localWebpSrcSet(src, widths = [480, 960]) {
  if (!src?.startsWith('/assets/')) return undefined;
  const match = src?.match(/^(.*)\.(?:jpe?g|png)$/i);
  return match ? widths.map((width) => `${match[1]}-${width}.webp ${width}w`).join(', ') : undefined;
}
