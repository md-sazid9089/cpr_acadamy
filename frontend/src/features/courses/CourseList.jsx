import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CategoryPills from './components/CategoryPills.jsx';
import CourseCard from './components/CourseCard.jsx';
import { useCatalog, useCourses } from './api/courses.queries.js';
import { catalogCategories, categoryFromSlug, categoryLabel, categorySlug } from './catalog.js';
import { useEnrollAction } from './hooks/useEnrollAction.js';
import Input from '@/components/ui/Input.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Button from '@/components/ui/Button.jsx';

/** Public catalogue for both /courses and /courses/:category. */
export default function CourseList() {
  const { category: categoryParam } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // The built-in three plus any category an admin created that has a published course.
  const { data: catalog } = useCatalog();
  const categories = useMemo(() => catalogCategories(catalog), [catalog]);
  const activeCategory = categoryFromSlug(categoryParam, categories);
  const { data: courses = [], isLoading, isError } = useCourses({ category: activeCategory, search });
  const onEnroll = useEnrollAction();

  const heading = useMemo(
    () => (activeCategory === 'ALL' ? 'All Courses' : categoryLabel(activeCategory)),
    [activeCategory],
  );

  const handleCategoryChange = (next) => {
    navigate(next === 'ALL' ? '/courses' : `/courses/${categorySlug(next)}`);
  };

  return (
    <div className="bg-white dark:bg-surface-dark">
      <section className="bg-surface-light py-12 dark:bg-surface-dark">
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

          <CategoryPills value={activeCategory} onChange={handleCategoryChange} categories={categories} className="mt-6" />
        </div>
      </section>

      <section className="container-page py-12">
        {isLoading ? (
          <ContentSkeleton variant="cards" label="Loading courses" />
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
