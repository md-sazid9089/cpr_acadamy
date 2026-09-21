import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { transformSync } from 'esbuild';
import { demoExams, demoPositions } from '../src/features/exams/demo-positions.js';

const exams = [
  { id: 'first', courseId: 'medicine', courseTitle: 'Medicine', title: 'Medicine paper', status: 'submitted', totalMarks: 100, durationMinutes: 60 },
  { id: 'second', courseId: 'surgery', courseTitle: 'Surgery', title: 'Surgery paper', status: 'running', totalMarks: 100, durationMinutes: 60 },
];

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}

function content(tree) {
  if (Array.isArray(tree)) return tree.map(content).join('');
  if (tree === null || tree === undefined || typeof tree === 'boolean') return '';
  return typeof tree === 'object' ? content(tree.props?.children) : String(tree);
}

function harness(search = '', demo = false) {
  let params = new URLSearchParams(search);
  let stateIndex = 0;
  const state = [];
  const queries = [];
  const jsx = (type, props) => ({ type, props });
  const entries = Array.from({ length: 26 }, (_, index) => ({
    rank: index === 2 ? 2 : index + 1, name: `Student ${index + 1}`,
    score: index === 2 ? 98 : 100 - index * 2, totalMarks: 100,
    passed: index < 16, tied: index === 1 || index === 2, isMe: index === 25,
  }));
  const context = { error: null, empty: false, loading: false, refetches: 0 };
  const dependencies = {
    react: { useState: initial => {
      const index = stateIndex++;
      if (state[index] === undefined) state[index] = initial;
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    } },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-router-dom': { useSearchParams: () => [params, value => { params = new URLSearchParams(value); }] },
    '@tanstack/react-query': { useQuery: options => {
      queries.push(options);
      if (options.queryKey[0] === 'exams-demo') return { data: options.queryFn({}), refetch: () => {} };
      if (options.queryKey[1] === 'position-options') return { data: exams };
      const [, , , page, limit] = options.queryKey;
      return { isLoading: context.loading, error: context.error, refetch: () => { context.refetches++; }, data: {
        exam: exams[0], participants: context.empty ? 0 : entries.length, pending: 0, provisional: true,
        highestScore: 100, averageScore: 75, me: context.empty ? null : entries[25],
        items: context.empty ? [] : entries.slice(page * limit, (page + 1) * limit),
      } };
    } },
    '@/components/ui/Button.jsx': { __esModule: true, default: 'button' },
    '@/components/ui/Badge.jsx': { __esModule: true, default: 'badge' },
    '@/components/ui/EmptyState.jsx': { __esModule: true, default: 'empty' },
    '@/components/ui/Skeleton.jsx': { __esModule: true, default: 'skeleton' },
    '@/features/student-dashboard/components/DashboardPageHeader.jsx': { __esModule: true, default: 'header' },
    '@/lib/utils': { formatDateTime: value => value },
    './demo-positions.js': { demoExams, demoPositions },
  };
  const module = { exports: {} };
  const source = readFileSync(new URL('../src/features/exams/ExamPositions.jsx', import.meta.url), 'utf8');
  const code = transformSync(source, { loader: 'jsx', format: 'cjs', jsx: 'automatic', define: { 'import.meta.env.DEV': 'false' } }).code;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => dependencies[name] ?? {} });
  return { context, queries,
    page: () => module.exports.default({ demo }),
    standings: () => {
      stateIndex = 0;
      const component = nodes(module.exports.default({ demo })).find(node => node.type?.name === 'Standings');
      return component.type(component.props);
    },
    get params() { return params; },
  };
}

test('positions keep the personal summary across pages, share ties and reset page on row-count change', () => {
  const app = harness();
  let view = app.standings();
  assert.match(content(view), /Position 26 of 26/);
  assert.match(content(view), /Provisional/);
  assert.match(content(view), /Joint/);
  assert.equal(nodes(view).find(node => node.props?.['aria-label'] === 'Previous page').props.disabled, true);
  assert.equal(nodes(view).find(node => node.type === 'tbody').props.children.length, 10);
  nodes(view).find(node => node.props?.['aria-label'] === 'Next page').props.onClick();
  view = app.standings();
  assert.match(content(view), /Showing 11-20 of 26 students/);
  assert.match(content(view), /Position 26 of 26/);
  assert.equal(app.queries.at(-1).queryKey[3], 1);
  nodes(view).find(node => node.props?.['aria-label'] === 'Next page').props.onClick();
  view = app.standings();
  assert.equal(nodes(view).find(node => node.props?.['aria-label'] === 'Next page').props.disabled, true);
  assert.equal(nodes(view).filter(node => node.type === 'tr' && node.props['aria-current'] === 'true').length, 1);
  nodes(view).find(node => node.props?.['aria-label'] === 'Rows per page').props.onChange({ target: { value: '25' } });
  view = app.standings();
  assert.match(content(view), /Showing 1-25 of 26 students/);
  assert.equal(app.queries.at(-1).queryKey[3], 0);
  assert.equal(app.queries.at(-1).queryKey[4], 25);
  assert.equal(app.queries.at(-1).refetchInterval, 30000);
});

test('positions distinguish empty, loading and embargoed results without displaying cached scores', () => {
  const app = harness();
  app.context.loading = true;
  const loadingView = app.standings();
  assert.equal(nodes(loadingView).some(node => node.type === 'skeleton' && node.props.variant === 'table'), true);
  assert.doesNotMatch(content(loadingView), /Student 26|Position 26/);
  app.context.loading = false;
  app.context.empty = true;
  let view = app.standings();
  assert.match(content(view), /No submitted result/);
  assert.equal(nodes(view).some(node => node.type === 'table'), false);
  assert.equal(nodes(view).find(node => node.type === 'empty').props.title, 'No submitted results yet');
  app.context.empty = false;
  app.context.error = { code: 'RESULTS_NOT_RELEASED', message: 'Not yet released' };
  view = app.standings();
  assert.equal(view.props.title, 'Positions not released yet');
  assert.doesNotMatch(content(view), /Student 26/);
  view.props.action.props.onClick();
  assert.equal(app.context.refetches, 1);
});

test('course filters and exam deep links select the correct paper and reject unavailable exams', () => {
  const app = harness('examId=second');
  let view = app.page();
  assert.equal(nodes(view).find(node => node.type?.name === 'Standings').props.examId, 'second');
  const surgeryChip = nodes(view).find(node => node.props?.children === 'Surgery' && node.props?.onClick);
  assert.equal(surgeryChip.props.active, true);
  const medicineChip = nodes(view).find(node => node.props?.children === 'Medicine' && node.props?.onClick);
  medicineChip.props.onClick();
  view = app.page();
  assert.equal(app.params.has('examId'), false);
  assert.equal(nodes(view).find(node => node.type?.name === 'Standings').props.examId, 'first');
  const unavailable = harness('examId=unavailable').page();
  assert.equal(nodes(unavailable).some(node => node.type?.name === 'Standings'), false);
  assert.equal(nodes(unavailable).find(node => node.type === 'empty').props.title, 'Exam unavailable');
});

test('demo uses isolated sample queries, working filters and pagination without real result links', () => {
  const app = harness('', true);
  assert.match(content(app.page()), /Demo data/);
  let view = app.standings();
  assert.match(content(view), /Arif Hasan/);
  assert.match(content(view), /Showing 1-10 of 36 students/);
  assert.equal(nodes(view).some(node => node.props?.to?.includes('/result')), false);
  nodes(view).find(node => node.props?.['aria-label'] === 'Next page').props.onClick();
  view = app.standings();
  assert.match(content(view), /Showing 11-20 of 36 students/);
  assert.equal(nodes(view).filter(node => node.type === 'tr' && node.props['aria-current'] === 'true').length, 1);
  const residencyChip = nodes(app.page()).find(node => node.props?.children === 'Residency / Surgery 2026' && node.props?.onClick);
  residencyChip.props.onClick();
  assert.equal(nodes(app.page()).find(node => node.type?.name === 'Standings').props.examId, 'demo-surgery');
  assert.equal(app.queries.every(query => query.queryKey[0] === 'exams-demo'), true);
  assert.equal(app.queries.filter(query => query.queryKey[1] === 'positions').every(query => query.refetchInterval === false), true);
});