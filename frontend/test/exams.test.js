import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { transformSync } from 'esbuild';
import { answerState } from '../src/features/exams/answer-state.js';
import { createAnswerQueue } from '../src/features/exams/answer-queue.js';

function loadModule(path, dependencies = {}) {
  const module = { exports: {} };
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const code = transformSync(source, { loader: path.endsWith('.jsx') ? 'jsx' : 'js', format: 'cjs', jsx: 'automatic' }).code;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => dependencies[name] ?? {} });
  return module.exports;
}

test('skipped MTF questions render in result review with null answers', () => {
  const { default: MtfQuestion } = loadModule('../src/features/exams/components/MtfQuestion.jsx', {
    '@/lib/utils': { cn: () => '' },
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
  });
  assert.doesNotThrow(() => MtfQuestion({ question: { options: [{ id: 'a', text: 'Statement' }] }, value: null, readOnly: true, correctAnswer: { a: false } }));
});

test('admin adapter preserves mixed types, individual marks and deduction percentages', async () => {
  let payload;
  const response = { id: 'exam', questionType: 'mixed', negativeMarking: 25, passMark: 70, totalMarks: 4, questions: [
    { id: 'mtf', type: 'mtf', marks: 0.4, options: [], correctAnswer: { a: true } },
    { id: 'sba', type: 'sba', marks: 2, options: [], correctAnswer: 'a' },
  ] };
  const api = loadModule('../src/features/admin/api/admin.api.js', {
    '@/constants': { QUESTION_TYPES: { SBA: 'sba', MTF: 'mtf' } },
    '@/lib/api-client': { get: async () => ({ data: response }), patch: async (_, body) => { payload = body; return { data: response }; } },
  });
  const exam = await api.fetchAdminExam('exam');
  assert.equal(exam.type, 'mixed');
  assert.equal(exam.totalMarks, 4);
  assert.equal(exam.deductionPercent, 25);
  await api.updateExam({ id: 'exam', questions: exam.questions, marksPerQuestion: 2 });
  assert.equal(payload.negativeMarking, undefined);
  assert.equal(payload.questions[0].marks, 0.4);
  assert.equal(payload.questions[1].marks, 2);
  await api.updateExam({ id: 'exam', deductionPercent: 25, marksPerQuestion: 2, passMark: 70 });
  assert.equal(payload.negativeMarking, 25);
  assert.equal(payload.passMark, 70);
  assert.equal(api.blankQuestion('mtf').marks, 0.4);
  assert.equal(api.blankQuestion('sba').marks, 2);
});

test('palette distinguishes blank, partial and complete MTF responses, including false', () => {
  const question = { type: 'mtf', options: ['a', 'b', 'c', 'd', 'e'].map(id => ({ id })) };
  assert.equal(answerState(question, null), 'unanswered');
  assert.equal(answerState(question, {}), 'unanswered');
  assert.equal(answerState(question, { a: false }), 'partial');
  assert.equal(answerState(question, { a: false, b: true, c: false, d: true, e: false }), 'answered');
  assert.equal(answerState({ ...question, type: 'sba' }, 'a'), 'answered');
});

test('position API loads exams beyond the first hundred and forwards pagination and cancellation', async () => {
  const requests = [];
  const signal = new AbortController().signal;
  const exams = Array.from({ length: 101 }, (_, index) => ({ id: `exam-${index}` }));
  const standings = { participants: 40, me: { rank: 39 }, items: [] };
  const api = loadModule('../src/features/exams/api/exams.api.js', {
    '@/lib/api-client': { get: async (url, options) => {
      requests.push({ url, ...options });
      return { data: url === '/exams' ? exams.slice(options.params.offset, options.params.offset + options.params.limit) : standings };
    } },
  });
  const options = await api.fetchPositionExams({ signal });
  assert.equal(options.length, 101);
  assert.equal(options[100].id, 'exam-100');
  assert.deepEqual(requests.map(request => request.params.offset), [0, 100]);
  assert.equal(requests.every(request => request.signal === signal), true);
  assert.equal(await api.fetchExamPositions('exam-100', { limit: 25, offset: 25, signal }), standings);
  assert.equal(requests.at(-1).url, '/exams/exam-100/positions');
  assert.equal(requests.at(-1).params.limit, 25);
  assert.equal(requests.at(-1).params.offset, 25);
  assert.equal(requests.at(-1).signal, signal);
});

test('autosave retries failures and serializes newer values behind pending saves', async () => {
  const statuses = [];
  const saved = [];
  let fail = true;
  let release;
  const queue = createAnswerQueue(async payload => {
    if (fail) throw new Error('Offline');
    saved.push(payload);
    if (saved.length === 1) await new Promise(resolve => { release = resolve; });
  }, status => statuses.push(status));
  queue.enqueue('q1', { a: false });
  await queue.flush();
  assert.equal(statuses.at(-1), 'error');
  assert.equal(queue.hasPending, true);
  fail = false;
  const retry = queue.flush();
  queue.enqueue('q1', { a: false, b: true });
  queue.enqueue('q2', 'a');
  release();
  await retry;
  assert.deepEqual(saved.map(item => item.questionId), ['q1', 'q1', 'q2']);
  assert.deepEqual(saved[1].answer, { a: false, b: true });
  assert.equal(queue.hasPending, false);
  assert.equal(statuses.at(-1), 'saved');
  queue.dispose();
  queue.enqueue('q3', 'b');
  assert.equal(queue.hasPending, false);
});