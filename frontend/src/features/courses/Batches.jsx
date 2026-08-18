import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaArrowLeftLong } from 'react-icons/fa6';
import CourseCard from './components/CourseCard.jsx';
import BatchGroupGrid from './components/BatchGroupGrid.jsx';
import BatchFilters from './components/BatchFilters.jsx';
import { useCourses } from './api/courses.queries.js';
import { useEnrollAction } from './hooks/useEnrollAction.js';
import Input from '@/components/ui/Input.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import Button from '@/components/ui/Button.jsx';
import { BATCH_GROUPS } from '@/constants';

/** Sentinel `?group=` value meaning "every batch we run". */
const ALL_GROUPS = 'all';

/** Facet key → query-string parameter name. */
const FACET_PARAMS = { batchTypes: 'type', sessions: 'session', branches: 'branch' };

/**
 * /batches — the batch catalogue.
 *
 * Two views share the route, switched by the `group` query parameter:
 *   - no `group`   → the category chooser (BatchGroupGrid)
 *   - with `group` → that category's batches beside the facet sidebar
 *
 * Every selectable thing lives in the URL, so a filtered view can be linked,
 * bookmarked or shared, and the back button steps through choices.
 */
export default function Batches() {
  const [searchParams, setSearchParams] = useSearchParams();

  const group = searchParams.get('group') ?? '';
  const search = searchParams.get('q') ?? '';
  const showResults = Boolean(group);

  // Selected facet ids, read straight back out of the URL.
  const filters = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(FACET_PARAMS).map(([key, param]) => [
          key,
          searchParams.get(param)?.split(',').filter(Boolean) ?? [],
        ]),
      ),
    [searchParams],
  );

  const activeGroup = BATCH_GROUPS.find((item) => item.id === group);

  const { data: courses = [], isLoading, isError } = useCourses({
    group: group && group !== ALL_GROUPS ? group : undefined,
    ...filters,
    search,
  });

  // Unfiltered catalogue, used only for the per-category counts on the chooser
  // cards. Shares the query cache with the list above.
  const { data: allCourses = [] } = useCourses();

  const groupCounts = useMemo(() => {
    const counts = {};
    for (const course of allCourses) {
      if (course.batchGroup) counts[course.batchGroup] = (counts[course.batchGroup] ?? 0) + 1;
    }
    return counts;
  }, [allCourses]);

  const onEnroll = useEnrollAction();

  /** Merge patches into the query string, dropping keys that go empty. */
  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  const handleFiltersChange = (nextFilters) => {
    updateParams(
      Object.fromEntries(
        Object.entries(FACET_PARAMS).map(([key, param]) => [param, nextFilters[key]?.join(',')]),
      ),
    );
  };

  const clearFilters = () => updateParams({ type: null, session: null, branch: null });

  return (
    <div className="bg-white dark:bg-surface-dark">
      <section className="bg-white py-12 dark:bg-surface-dark">
        <div className="container-page text-center">
          {showResults && (
            <Link
              to="/batches"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
            >
              <FaArrowLeftLong aria-hidden="true" className="h-3.5 w-3.5" />
              All categories
            </Link>
          )}

          <h1 className="section-heading" lang={showResults ? undefined : 'bn'}>
            {showResults ? (activeGroup?.label ?? 'All Batches') : 'আপনার কাঙ্ক্ষিত ব্যাচটি খুঁজে নিন'}
          </h1>
          <p className="section-subheading mx-auto text-center" lang={showResults ? undefined : 'bn'}>
            {showResults
              ? 'Narrow the list with the filters, then enrol in the batch that fits your schedule.'
              : 'নিচের ক্যাটাগরিতে প্রবেশ করে আপনার পছন্দ মত ব্যাচে এনরোল করুন'}
          </p>

          {showResults && (
            <div className="mx-auto mt-6 max-w-md">
              <Input
                type="search"
                placeholder="Search batches…"
                value={search}
                onChange={(event) => updateParams({ q: event.target.value })}
                aria-label="Search batches"
              />
            </div>
          )}
        </div>
      </section>

      {showResults ? (
        <section className="container-page grid gap-8 py-12 lg:grid-cols-[17rem_1fr]">
          <BatchFilters
            value={filters}
            onChange={handleFiltersChange}
            onClear={clearFilters}
            className="lg:sticky lg:top-24 lg:self-start"
          />

          <div>
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Spinner size="lg" label="Loading batches…" />
              </div>
            ) : isError ? (
              <EmptyState
                title="Couldn't load batches"
                description="Please refresh the page or try again in a moment."
                action={<Button onClick={() => window.location.reload()}>Retry</Button>}
              />
            ) : courses.length === 0 ? (
              <EmptyState
                title="No batches matched"
                description="Try clearing a filter, or pick a different category."
                action={
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <>
                <p className="mb-5 text-sm text-slate-600 dark:text-slate-400">
                  {courses.length} {courses.length === 1 ? 'batch' : 'batches'} available
                </p>
                {/* Two-up beside the sidebar: the card's overlapping info block
                    needs ~400px to sit inside its gradient, which a third column
                    at this container width would not leave. */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} onEnroll={onEnroll} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      ) : (
        <section className="container-page py-12">
          <BatchGroupGrid counts={groupCounts} />

          <div className="mt-10 text-center">
            <Button variant="outline" to={`/batches?group=${ALL_GROUPS}`}>
              Browse every batch instead
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
