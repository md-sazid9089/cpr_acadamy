import { cn } from '@/lib/utils';

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn('rounded bg-stone-200/70 motion-safe:animate-pulse dark:bg-stone-300/20', className)} />;
}

function TextRows({ count = 4 }) {
  return Array.from({ length: count }, (_, index) => (
    <div key={index} className="flex items-center gap-4 border-b border-stone-200 py-4 last:border-0">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-3">
        <Skeleton className={index % 2 ? 'h-3 w-1/2' : 'h-3 w-2/3'} />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-6 w-16 shrink-0" />
    </div>
  ));
}

export default function ContentSkeleton({ variant = 'list', label = 'Loading content', className }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={cn('w-full min-w-0', className)} data-skeleton={variant}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        {variant === 'cards' ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-stone-200">
                <Skeleton className="aspect-video w-full rounded-none" />
                <div className="space-y-4 p-5">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-5 w-5/6" />
                  <Skeleton className="h-3 w-2/3" />
                  <div className="flex justify-between gap-4 pt-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : variant === 'table' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-6 border-b border-stone-200 pb-5">
              <Skeleton className="h-16 w-24" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="divide-y divide-stone-200">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="grid grid-cols-[3rem_minmax(0,1fr)_4rem] items-center gap-4 py-4 sm:grid-cols-[5rem_minmax(0,1fr)_6rem_5rem]">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="hidden h-4 w-full sm:block" />
                </div>
              ))}
            </div>
          </div>
        ) : variant === 'exam' ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="min-w-0 space-y-6">
              <div className="flex justify-between gap-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex items-center gap-4 border-b border-stone-200 py-4">
                  <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
            <div className="space-y-6">
              <Skeleton className="h-5 w-32" />
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 20 }, (_, index) => <Skeleton key={index} className="aspect-square w-full" />)}
              </div>
              <Skeleton className="h-11 w-full" />
            </div>
          </div>
        ) : variant === 'form' ? (
          <div className="mx-auto max-w-md space-y-7 py-8">
            <Skeleton className="mx-auto h-12 w-12 rounded-full" />
            <Skeleton className="mx-auto h-6 w-2/3" />
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
            <Skeleton className="h-12 w-full" />
          </div>
        ) : variant === 'detail' ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-6">
              <Skeleton className="aspect-video w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
            <div className="min-w-0 space-y-4">
              <Skeleton className="h-7 w-2/3" />
              <TextRows count={4} />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : variant === 'dashboard' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="space-y-4 rounded-lg border border-stone-200 p-5">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-7 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="min-w-0 space-y-4">
                <Skeleton className="h-5 w-40" />
                <TextRows />
              </div>
              <div className="min-w-0 space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </div>
        ) : (
          <TextRows />
        )}
      </div>
    </div>
  );
}

export function PageSkeleton({ variant = 'dashboard' }) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {variant !== 'form' && (
        <div aria-hidden="true" className="space-y-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-2/3 max-w-sm" />
          <Skeleton className="h-3 w-1/2 max-w-md" />
        </div>
      )}
      <ContentSkeleton variant={variant} label="Loading page" />
    </div>
  );
}