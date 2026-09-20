import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FaPlus } from 'react-icons/fa6';
import { fetchAdminCourses } from './api/admin.api.js';
import NewCourseDialog from './courses/NewCourseDialog.jsx';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Table from '@/components/ui/Table.jsx';
import Badge, { StatusBadge } from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import { BATCH_GROUPS, COURSE_STATUS } from '@/constants';
import { cn, formatBDT, formatDate, formatNumber } from '@/lib/utils';

const FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: COURSE_STATUS.PUBLISHED, label: 'Published' },
  { id: COURSE_STATUS.DRAFT, label: 'Draft' },
];

const GROUP_LABELS = Object.fromEntries(BATCH_GROUPS.map((group) => [group.id, group.label]));

export default function AdminCourses() {
  const [filter, setFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  const { data: courses = [], isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: fetchAdminCourses,
  });

  const rows = filter === 'ALL' ? courses : courses.filter((course) => course.status === filter);

  const columns = [
    {
      key: 'title',
      header: 'Course',
      render: (row) => (
        <div className="max-w-md">
          <p className="font-medium text-stone-900 dark:text-white">{row.title}</p>
          {row.batchGroup && (
            <p className="text-xs text-stone-500 dark:text-brand-200">{GROUP_LABELS[row.batchGroup] ?? row.batchGroup}</p>
          )}
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (row) => <Badge tone="brand">{row.category}</Badge> },
    { key: 'startsOn', header: 'Starts', render: (row) => formatDate(row.startsOn) },
    { key: 'enrolledCount', header: 'Enrolled', align: 'right', render: (row) => formatNumber(row.enrolledCount) },
    {
      key: 'price',
      header: 'Fee',
      align: 'right',
      render: (row) => (
        <span>
          {formatBDT(row.discountPrice ?? row.price)}
          {row.discountPrice && (
            <span className="ml-1.5 text-xs text-stone-400 line-through dark:text-brand-200">{formatBDT(row.price)}</span>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <>
      <Card>
        <CardHeader
          title="Courses"
          description="Create a course once, then fill in its details, videos, exams and routine from its tabs."
          action={
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <FaPlus aria-hidden="true" className="h-3.5 w-3.5" />
              New course
            </Button>
          }
        />

        <div className="flex flex-wrap gap-2 px-5 pt-4">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                filter === option.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-surface-dark dark:text-brand-200',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <Table
            columns={columns}
            rows={rows}
            isLoading={isLoading}
            isError={isError}
            error={error}
            isFetching={isFetching}
            onRetry={refetch}
            onRowClick={(row) => navigate(`/admin/courses/${row.id}`)}
            emptyTitle="No courses yet"
            emptyDescription="Create the first course to get started."
          />
        </div>
      </Card>

      <NewCourseDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
