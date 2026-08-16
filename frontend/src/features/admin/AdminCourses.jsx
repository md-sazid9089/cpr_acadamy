import { useQuery } from '@tanstack/react-query';
import { fetchAdminCourses } from './api/admin.api.js';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Table from '@/components/ui/Table.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import { formatBDT, formatDate } from '@/lib/utils';

export default function AdminCourses() {
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: fetchAdminCourses,
  });

  const columns = [
    {
      key: 'title',
      header: 'Course',
      render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.title}</span>,
    },
    { key: 'category', header: 'Category', render: (row) => <Badge tone="brand">{row.category}</Badge> },
    { key: 'startsOn', header: 'Starts', render: (row) => formatDate(row.startsOn) },
    { key: 'enrolled', header: 'Enrolled', align: 'right', render: (row) => row.enrolled.toLocaleString('en-BD') },
    { key: 'price', header: 'Price', align: 'right', render: (row) => formatBDT(row.price) },
    {
      key: 'isPublished',
      header: 'Status',
      align: 'right',
      render: (row) => (
        <Badge tone={row.isPublished ? 'success' : 'neutral'}>
          {row.isPublished ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Courses"
        description="Batches, pricing and publication state."
        action={
          // TODO: build the course editor once the admin API is defined.
          <Button size="sm" disabled>
            New course
          </Button>
        }
      />
      <Table
        columns={columns}
        rows={courses}
        isLoading={isLoading}
        emptyTitle="No courses yet"
        emptyDescription="Create the first batch to get started."
      />
    </Card>
  );
}
