import { Link, useParams } from 'react-router-dom';
import { FaStar } from 'react-icons/fa6';
import { useCourse } from './api/courses.queries.js';
import { useEnrollAction } from './hooks/useEnrollAction.js';
import Card, { CardBody } from '@/components/ui/Card.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { formatBDT, formatDate } from '@/lib/utils';

const KIND_LABELS = { video: 'Video', pdf: 'PDF', note: 'Note', live: 'Live class' };

export default function CourseDetail() {
  const { slug } = useParams();
  const { data: course, isLoading, isError } = useCourse(slug);
  const onEnroll = useEnrollAction();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label="Loading course…" />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <EmptyState
        className="min-h-[50vh]"
        title="Course not found"
        description="The course you're looking for may have been renamed or archived."
        action={<Button to="/courses">Browse all courses</Button>}
      />
    );
  }

  const hasDiscount = Boolean(course.discountPrice);

  return (
    <div className="bg-white dark:bg-surface-dark">
      <section className="border-b border-slate-200 bg-gradient-to-br from-brand-700 to-emerald-900 py-12 text-white dark:border-slate-800">
        <div className="container-page">
          <nav className="mb-4 flex items-center gap-2 text-sm text-brand-100" aria-label="Breadcrumb">
            <Link to="/courses" className="hover:text-white">
              Courses
            </Link>
            <span aria-hidden="true">/</span>
            <span>{course.category}</span>
          </nav>

          <Badge tone="brand" className="bg-white/90 text-brand-800 ring-white/40">
            {course.category}
          </Badge>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            {course.title}
          </h1>
          <p className="mt-3 max-w-2xl text-brand-100">{course.subtitle}</p>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <span className="flex items-center gap-1.5">
              <FaStar aria-hidden="true" className="h-3.5 w-3.5 text-amber-400" />
              {course.rating ?? '—'} rating
            </span>
            <span>{course.enrolledCount.toLocaleString('en-BD')} enrolled</span>
            <span>{course.lessonCount} lessons</span>
            <span>{course.duration}</span>
            {course.startsOn && <span>Starts {formatDate(course.startsOn)}</span>}
          </div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-12 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="section-heading text-xl">What this course covers</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {course.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="flex gap-2 rounded-lg bg-surface-subtle p-3 text-sm text-slate-700 dark:bg-surface-dark-subtle dark:text-slate-300"
                >
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {highlight}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="section-heading text-xl">Curriculum</h2>
            <div className="mt-4 space-y-4">
              {course.curriculum?.map((module) => (
                <Card key={module.id}>
                  <CardBody className="p-0">
                    <p className="border-b border-slate-200 px-5 py-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
                      {module.title}
                    </p>
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                      {module.lessons.map((lesson) => (
                        <li key={lesson.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                          <span className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                            {lesson.isLocked ? (
                              <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="4" y="10" width="16" height="10" rx="2" />
                                <path d="M8 10V7a4 4 0 118 0v3" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4 text-brand-600 dark:text-brand-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5l10 7-10 7z" />
                              </svg>
                            )}
                            {lesson.title}
                          </span>
                          <span className="shrink-0 text-xs text-slate-400">
                            {KIND_LABELS[lesson.kind]}
                            {lesson.durationMinutes ? ` · ${lesson.durationMinutes} min` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-1">
          <Card className="sticky top-24 p-6">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-brand-700 dark:text-brand-400">
                {formatBDT(hasDiscount ? course.discountPrice : course.price)}
              </span>
              {hasDiscount && (
                <span className="text-base text-slate-400 line-through">{formatBDT(course.price)}</span>
              )}
            </div>

            <Button fullWidth size="lg" className="mt-5" onClick={() => onEnroll(course)}>
              Enrol Now
            </Button>
            <Button fullWidth variant="outline" className="mt-3" href="#curriculum">
              Download syllabus
            </Button>

            <dl className="mt-6 space-y-3 text-sm">
              {[
                ['Duration', course.duration],
                ['Lessons', course.lessonCount],
                ['Batch starts', formatDate(course.startsOn)],
                ['Access', 'Until exam date'],
                ['Certificate', 'On completion'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-200">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}
