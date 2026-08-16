import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const VARIANTS = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 dark:bg-brand-500 dark:hover:bg-brand-600',
  secondary:
    'bg-brand-50 text-brand-800 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-200 dark:hover:bg-brand-900',
  outline:
    'border border-slate-300 bg-white text-slate-700 hover:border-brand-500 hover:text-brand-700 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:border-brand-500 dark:hover:text-brand-300',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  // Promo pair: a solid neutral and the warm `accent` token from the theme.
  contrast:
    'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white',
  accent:
    'bg-accent-500 text-accent-950 hover:bg-accent-400 active:bg-accent-600 dark:bg-accent-500 dark:text-accent-950 dark:hover:bg-accent-400',
  // For use on the dark green hero/CTA bands, where the surrounding colour is
  // the same in both themes — so these must not flip with dark mode.
  inverse: 'bg-white text-brand-800 hover:bg-brand-50 dark:bg-white dark:text-brand-800 dark:hover:bg-brand-50',
  'inverse-outline':
    'border border-white/40 bg-transparent text-white hover:border-white dark:border-white/40 dark:bg-transparent dark:text-white dark:hover:border-white',
};

const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-10 w-10',
};

/**
 * Renders a <button>, or a router <Link> when `to` is given, or an <a> when
 * `href` is given — so every clickable shares one visual language.
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
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
  const classes = cn(
    'inline-flex items-center justify-center rounded-lg font-semibold transition-colors duration-150',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
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
      {children}
    </>
  );

  // A disabled link is still clickable, so fall through to a real <button>.
  const isInert = disabled || isLoading;

  if (to && !isInert) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  if (href && !isInert) {
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button ref={ref} className={classes} disabled={isInert} {...props}>
      {content}
    </button>
  );
});

export default Button;
