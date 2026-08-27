import { useMemo, useState } from 'react';
import CategoryPills from '@/features/courses/components/CategoryPills.jsx';
import CourseCard from '@/features/courses/components/CourseCard.jsx';
import { useFeaturedCourses } from '@/features/courses/api/courses.queries.js';
import { useEnrollAction } from '@/features/courses/hooks/useEnrollAction.js';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';

/** Category pills + featured course grid — the core of the homepage. */
export default function FeaturedCourses() {
  const [category, setCategory] = useState('ALL');
  const { data: courses = [], isLoading, isError } = useFeaturedCourses();
  const onEnroll = useEnrollAction();

  // Filtering happens client-side here: the featured set is small and already
  // in cache, so a per-category request would only add latency.
  const visible = useMemo(
    () => (category === 'ALL' ? courses : courses.filter((course) => course.category === category)),
    [courses, category],
  );

  const counts = useMemo(
    () =>
      courses.reduce(
        (acc, course) => ({ ...acc, [course.category]: (acc[course.category] ?? 0) + 1 }),
        { ALL: courses.length },
      ),
    [courses],
  );

  return (
    <section className="bg-white py-12 dark:bg-surface-dark">
      <div className="container-page">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white" lang="bn">
            আপনার কাঙ্খিত কোর্সটি খুঁজে নিন
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium text-slate-600 sm:text-base dark:text-slate-400" lang="bn">
            প্রিলি থেকে ভাইভা-আপনার স্বপ্নপূরণে ২৪/৭ পাশে থাকবো আমরা!
          </p>
        </div>

        <CategoryPills value={category} onChange={setCategory} counts={counts} className="mt-8" />

        <div className="mt-10">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" label="Loading courses…" />
            </div>
          ) : isError ? (
            <EmptyState
              title="Couldn't load featured batches"
              description="Please refresh the page in a moment."
            />
          ) : visible.length === 0 ? (
            <EmptyState
              title={`No featured ${category} batch right now`}
              description="New batches are announced every month — check the full catalogue."
              action={<Button to="/batches">Browse all batches</Button>}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((course) => (
                <CourseCard key={course.id} course={course} onEnroll={onEnroll} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 text-center">
          <Button to="/batches" variant="outline" size="lg">
            View all batches
          </Button>
        </div>
      </div>
    </section>
  );
}
