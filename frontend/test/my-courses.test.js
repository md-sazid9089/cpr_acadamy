import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import postcss from 'postcss';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const source = read('../src/features/student-dashboard/MyCourses.jsx');
const styles = postcss.parse(read('../src/features/student-dashboard/MyCourses.css'));

test('batch grid has responsive columns and a deliberate single-batch width', () => {
  assert.ok(source.includes('grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'));
  assert.ok(source.includes("filteredCourses.length === 1 ? 'course-grid--single'"));
  const single = new Map();
  styles.walkRules('.course-grid--single', (rule) => rule.walkDecls((declaration) => single.set(declaration.prop, declaration.value)));
  assert.equal(single.get('max-width'), '640px');
  assert.equal(single.get('grid-template-columns'), 'minmax(0, 1fr)');
});

test('batch tabs preserve the existing status filters and use a count instead of a panel title', () => {
  for (const status of ['active', 'pending_payment', 'expired']) assert.ok(source.includes(`course.status === '${status}'`));
  assert.ok(source.includes('<DashboardTabs tabs={TABS} value={activeTab} onChange={setActiveTab} />'));
  assert.ok(source.includes("filteredCourses.length === 1 ? 'batch' : 'batches'"));
  assert.equal(source.includes('Section title header'), false);
});

test('loading and errors retain the page controls without masquerading as empty batches', () => {
  assert.ok(source.indexOf('<DashboardTabs') < source.indexOf('{isLoading ?'));
  assert.ok(source.includes('isError ? ('));
  assert.ok(source.includes('role="alert"'));
  assert.ok(source.includes('onClick={() => refetch()}'));
});

test('completion uses exact lesson counts rather than a rounded percentage', () => {
  const expression = source.match(/const isCompleted = (.+);/)[1];
  const isCompleted = new Function('course', `return ${expression}`);
  assert.equal(isCompleted({ lessonCount: 2, completedLessons: 2, nextLesson: null }), true);
  assert.equal(isCompleted({ lessonCount: 201, completedLessons: 200, progress: 100, nextLesson: { title: 'Remaining lesson' } }), false);
  assert.equal(isCompleted({ lessonCount: 0, completedLessons: 0, nextLesson: null }), false);
  assert.equal(isCompleted({ progress: 100 }), false);
  assert.ok(source.includes('Review Materials'));
  assert.ok(source.includes('course-completed'));
});

test('cards retain their routes with one primary action and account-level subscriptions outside the list', () => {
  const cards = source.slice(source.indexOf('filteredCourses.map'));
  assert.equal((cards.match(/className="course-primary-action"/g) || []).length, 1);
  assert.equal(cards.includes('/dashboard/subscriptions'), false);
  for (const destination of ['to={scheduleUrl}', '/dashboard/course/${course.slug}', '/dashboard/checkout/${course.slug}', '/dashboard/exams']) assert.ok(cards.includes(destination));
  assert.ok(source.includes('aria-label="Breadcrumb"'));
  assert.ok(source.includes('course-access-notice'));
});

test('courses use a flat surface and logged-in navigation keeps marketing links secondary', () => {
  const layout = read('../src/components/layout/DashboardLayout.jsx');
  const navbar = read('../src/components/layout/Navbar.jsx');
  assert.ok(layout.includes('!isCoursesPage &&'));
  assert.ok(layout.includes('course-dashboard-layout'));
  assert.ok(navbar.includes('isStudent ? STUDENT_LINKS : NAV_LINKS'));
  assert.ok(navbar.includes('Academy</summary>'));
  assert.ok(navbar.includes("label: 'Complaint Box'"));
});