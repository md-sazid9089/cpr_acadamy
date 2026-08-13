import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CategoryPills from './components/CategoryPills.jsx';
import CourseCard from './components/CourseCard.jsx';
import { useCourses } from './api/courses.queries.js';
import { useEnrollAction } from './hooks/useEnrollAction.js';
import Input from '@/components/ui/Input.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Button from '@/components/ui/Button.jsx';
import { CATEGORY_LABELS, CATEGORY_SLUGS, COURSE_CATEGORIES } from '@/constants';

/** Resolve the `:category` URL segment ('fcps') to a category ('FCPS'). */
function categoryFromSlug(slug) {
  if (!slug) return 'ALL';
  const match = COURSE_CATEGORIES.find((category) => CATEGORY_SLUGS[category] === slug.toLowerCase());
  return match ?? 'ALL';
}

/** Public catalogue for both /courses and /courses/:category. */
export default function CourseList() {
  const { category: categoryParam } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const activeCategory = categoryFromSlug(categoryParam);
  const { data: courses = [], isLoading, isError } = useCourses({ category: activeCategory, search });
  const onEnroll = useEnrollAction();

  const heading = useMemo(
    () => (activeCategory === 'ALL' ? 'All Courses' : CATEGORY_LABELS[activeCategory]),
    [activeCategory],
  );

  const handleCategoryChange = (next) => {
    navigate(next === 'ALL' ? '/courses' : `/courses/${CATEGORY_SLUGS[next]}`);
  };

  return (
    <div className="bg-white dark:bg-surface-dark">
      <section className="border-b border-slate-200 bg-surface-subtle py-12 dark:border-slate-800 dark:bg-surface-dark-subtle">
        <div className="container-page text-center">
          <h1 className="section-heading">{heading}</h1>
          <p className="section-subheading mx-auto text-center">
            Choose a track and start preparing with structured lectures, question banks and regular
            assessment.
          </p>

          <div className="mx-auto mt-6 max-w-md">
            <Input
              type="search"
              placeholder="Search courses…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search courses"
            />
          </div>

          <CategoryPills value={activeCategory} onChange={handleCategoryChange} className="mt-6" />
        </div>
      </section>

      <section className="container-page py-12">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" label="Loading courses…" />
          </div>
        ) : isError ? (
          <EmptyState
            title="Couldn't load courses"
            description="Please refresh the page or try again in a moment."
            action={<Button onClick={() => window.location.reload()}>Retry</Button>}
          />
        ) : courses.length === 0 ? (
          <EmptyState
            title="No courses matched"
            description="Try a different category or clear the search box."
            action={
              <Button variant="outline" onClick={() => setSearch('')}>
                Clear search
              </Button>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} onEnroll={onEnroll} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
