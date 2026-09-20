import { cn } from '@/lib/utils';
import { Skeleton } from './Skeleton.jsx';
import EmptyState from './EmptyState.jsx';

/**
 * Column-driven table used by dashboard and admin lists.
 *
 * @param {Object} props
 * @param {{ key: string, header: string, render?: (row: any) => import('react').ReactNode, className?: string, align?: 'left'|'right'|'center' }[]} props.columns
 * @param {any[]} props.rows
 */
export default function Table({
  columns,
  rows = [],
  isLoading = false,
  isError = false,
  error,
  isFetching = false,
  onRetry,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  getRowId = (row, index) => row?.id ?? index,
  onRowClick,
  className,
}) {
  // A failed request is not the same as a genuinely empty result — collapsing the two would
  // read as "there's nothing here" when the real story is "this couldn't be loaded".
  if (!isLoading && isError) {
    return (
      <EmptyState
        variant="error"
        title="Couldn't load this data"
        description={error?.message || 'Something went wrong. Please try again.'}
        onRetry={onRetry}
        isFetching={isFetching}
      />
    );
  }

  if (!isLoading && !rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const alignClass = (align) =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={cn('overflow-x-auto', className)} aria-busy={isLoading}>
      {isLoading && <span role="status" className="sr-only">Loading table</span>}
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-stone-200 dark:border-stone-200">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-brand-200',
                  alignClass(column.align),
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200 dark:divide-stone-200">
          {isLoading ? Array.from({ length: 5 }, (_, index) => (
            <tr key={index} aria-hidden="true">
              {columns.map((column) => (
                <td key={column.key} className={cn('px-4 py-4', column.className)}>
                  <Skeleton className={cn('h-4 w-3/4', column.align === 'right' && 'ml-auto', column.align === 'center' && 'mx-auto')} />
                </td>
              ))}
            </tr>
          )) : rows.map((row, index) => (
            <tr
              key={getRowId(row, index)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'transition-colors',
                onRowClick && 'cursor-pointer hover:bg-stone-50 dark:hover:bg-surface-dark',
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-stone-700 dark:text-brand-200',
                    alignClass(column.align),
                    column.className,
                  )}
                >
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
