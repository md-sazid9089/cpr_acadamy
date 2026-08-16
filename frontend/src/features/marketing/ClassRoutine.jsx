import { useMemo, useState } from 'react';
import CategoryPills from '@/features/courses/components/CategoryPills.jsx';
import Card from '@/components/ui/Card.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Table from '@/components/ui/Table.jsx';
import Button from '@/components/ui/Button.jsx';

// TODO: replace with GET /class-routine (weekly schedule) via TanStack Query.
const ROUTINE = [
  { id: 'r-1', day: 'Saturday', time: '8:00 PM – 9:30 PM', category: 'FCPS', topic: 'Cardiovascular physiology — part 2', faculty: 'Dr. Nusrat Jahan', mode: 'Live' },
  { id: 'r-2', day: 'Saturday', time: '9:45 PM – 11:00 PM', category: 'BCS', topic: 'Bangladesh affairs — liberation war', faculty: 'Md. Kamrul Islam', mode: 'Live' },
  { id: 'r-3', day: 'Sunday', time: '8:00 PM – 9:30 PM', category: 'MBBS', topic: 'Anatomy — upper limb revision', faculty: 'Dr. Tanvir Ahmed', mode: 'Live' },
  { id: 'r-4', day: 'Monday', time: '8:00 PM – 9:30 PM', category: 'FCPS', topic: 'Pharmacology — autonomic drugs', faculty: 'Dr. Shirin Sultana', mode: 'Live' },
  { id: 'r-5', day: 'Tuesday', time: '9:00 PM – 10:00 PM', category: 'BCS', topic: 'Model test 12 — discussion', faculty: 'Panel', mode: 'Exam' },
  { id: 'r-6', day: 'Wednesday', time: '8:00 PM – 9:30 PM', category: 'MBBS', topic: 'Pathology — inflammation', faculty: 'Dr. Rafiqul Hasan', mode: 'Live' },
  { id: 'r-7', day: 'Thursday', time: '8:00 PM – 9:30 PM', category: 'FCPS', topic: 'Weekly SBA exam + item analysis', faculty: 'Panel', mode: 'Exam' },
  { id: 'r-8', day: 'Friday', time: '10:00 AM – 12:00 PM', category: 'FCPS', topic: 'Doubt-clearing session', faculty: 'Faculty panel', mode: 'Live' },
];

const columns = [
  { key: 'day', header: 'Day', className: 'font-medium text-slate-900 dark:text-white' },
  { key: 'time', header: 'Time' },
  {
    key: 'category',
    header: 'Track',
    render: (row) => <Badge tone="brand">{row.category}</Badge>,
  },
  { key: 'topic', header: 'Topic' },
  { key: 'faculty', header: 'Faculty' },
  {
    key: 'mode',
    header: 'Type',
    align: 'right',
    render: (row) => (
      <Badge tone={row.mode === 'Exam' ? 'warning' : 'success'}>{row.mode}</Badge>
    ),
  },
];

/** Public weekly class routine at /class. */
export default function ClassRoutine() {
  const [category, setCategory] = useState('ALL');

  const rows = useMemo(
    () => (category === 'ALL' ? ROUTINE : ROUTINE.filter((item) => item.category === category)),
    [category],
  );

  return (
    <div className="bg-white dark:bg-surface-dark">
      <section className="border-b border-slate-200 bg-surface-subtle py-12 text-center dark:border-slate-800 dark:bg-surface-dark-subtle">
        <div className="container-page">
          <h1 className="section-heading">Class Routine</h1>
          <p className="section-subheading mx-auto text-center">
            Live classes and scheduled exams for the current week. Recordings are published in your
            dashboard within a few hours of each session.
          </p>
          <CategoryPills value={category} onChange={setCategory} className="mt-6" />
        </div>
      </section>

      <section className="container-page py-12">
        <Card className="overflow-hidden">
          <Table
            columns={columns}
            rows={rows}
            emptyTitle="No classes scheduled"
            emptyDescription="There is no class for this track in the current week."
          />
        </Card>

        <div className="mt-8 rounded-xl border border-dashed border-brand-300 bg-brand-50/60 p-5 text-sm text-brand-900 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200">
          <p className="font-semibold">Enrolled students</p>
          <p className="mt-1">
            Join links appear in your dashboard 15 minutes before each live class starts.
          </p>
          <Button to="/dashboard" variant="outline" size="sm" className="mt-3">
            Go to dashboard
          </Button>
        </div>
      </section>
    </div>
  );
}
