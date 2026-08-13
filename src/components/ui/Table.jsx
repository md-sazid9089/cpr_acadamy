import { cn } from '@/lib/utils';
import Spinner from './Spinner.jsx';
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
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  getRowId = (row, index) => row?.id ?? index,
  onRowClick,
  className,
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Loading…" />
      </div>
    );
  }

  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const alignClass = (align) =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400',
                  alignClass(column.align),
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row, index) => (
            <tr
              key={getRowId(row, index)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'transition-colors',
                onRowClick && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50',
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-slate-700 dark:text-slate-300',
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
