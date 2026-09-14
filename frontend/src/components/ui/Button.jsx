import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const VARIANTS = {
  primary:
    'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-950',
  secondary:
    'bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800',
  outline:
    'border border-solid border-stone-200 bg-white text-brand-600 hover:border-stone-200 hover:text-brand-700 dark:border-stone-200 dark:bg-transparent dark:text-brand-200 dark:hover:border-stone-200 dark:hover:text-brand-300',
  ghost:
    'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-brand-200 dark:hover:bg-surface-dark dark:hover:text-white',
  danger: 'border border-stone-200 bg-white text-red-600 hover:bg-red-50 dark:bg-surface-dark dark:text-brand-200',
  contrast:
    'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-950',
  accent:
    'ui-button-cta bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700',
  inverse: 'bg-white text-brand-800 hover:bg-brand-50 dark:bg-white dark:text-brand-800 dark:hover:bg-brand-50',
  'inverse-outline':
    'border border-stone-200 bg-transparent text-white hover:border-stone-200 dark:border-stone-200 dark:bg-transparent dark:text-white dark:hover:border-stone-200',
};

/**
 * Renders a <button>, or a router <Link> when `to` is given, or an <a> when
 * `href` is given — so every clickable shares one visual language.
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    shape = 'rounded',
    className,
    isLoading = false,
    disabled,
    fullWidth = false,
    to,
    href,
    children,
    ...props
  },
  ref,
) {
  const elementRef = useRef(null);
  const labelRef = useRef(null);
  const [isPill, setIsPill] = useState(false);
  useImperativeHandle(ref, () => elementRef.current);

  useEffect(() => {
    if (shape !== 'pill') return;
    const label = labelRef.current;
    const updateShape = () => {
      const words = label.textContent.trim().split(/\s+/).filter(Boolean);
      const lineHeight = parseFloat(getComputedStyle(label).lineHeight);
      setIsPill(words.length <= 3 && label.getBoundingClientRect().height < lineHeight * 1.5);
    };
    const observer = new ResizeObserver(updateShape);
    observer.observe(label);
    updateShape();
    return () => observer.disconnect();
  }, [shape, children, isLoading, disabled]);

  const classes = cn(
    'ui-button inline-flex items-center justify-center border border-stone-200 text-center font-semibold transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-light dark:focus-visible:ring-brand-300 dark:focus-visible:ring-offset-surface-dark',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant] ?? VARIANTS.primary,
    fullWidth && 'w-full',
    className,
  );

  const content = (
    <>
      {isLoading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {shape === 'pill' ? <span ref={labelRef} className="min-w-0">{children}</span> : children}
    </>
  );

  // A disabled link is still clickable, so fall through to a real <button>.
  const isInert = disabled || isLoading;

  if (to && !isInert) {
    return (
      <Link ref={elementRef} to={to} className={classes} {...props} data-size={size} data-pill={shape === 'pill' && isPill}>
        {content}
      </Link>
    );
  }

  if (href && !isInert) {
    return (
      <a ref={elementRef} href={href} className={classes} {...props} data-size={size} data-pill={shape === 'pill' && isPill}>
        {content}
      </a>
    );
  }

  return (
    <button ref={elementRef} className={classes} disabled={isInert} {...props} data-size={size} data-pill={shape === 'pill' && isPill}>
      {content}
    </button>
  );
});

export default Button;
