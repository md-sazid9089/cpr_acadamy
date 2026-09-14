import assert from 'node:assert/strict';
import test from 'node:test';
import { gradePaper, validatePublication } from '../src/modules/exams.js';
import { fixture } from '../test-support/fixture.js';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { openDatabase, migrate, one } from '../src/db.js';

function question(type, index) {
  return { id: `q${index}`, type, stem: 'Question', options: ['a', 'b', 'c', 'd', 'e'].map(id => ({ id, text: id })), correctAnswer: type === 'mtf' ? { a: true, b: false, c: true, d: false, e: true } : 'a', marks: type === 'mtf' ? 0.4 : 2 };
}

const questions = Array.from({ length: 50 }, (_, index) => question(index < 30 ? 'mtf' : 'sba', index));
const policy = { isPublished: true, questionType: 'mixed', questions, targetQuestionCount: 50, negativeMarking: 0, passMark: 70 };

test('mixed policy enforces count, blocks, stem count, marks and pass threshold', () => {
  assert.doesNotThrow(() => validatePublication(policy));
  for (const invalid of [
    { questions: questions.slice(1) }, { targetQuestionCount: 49 },
    { questions: [...questions].reverse() },
    { questions: [{ ...questions[0], options: questions[0].options.slice(1) }, ...questions.slice(1)] },
    { questions: [{ ...questions[0], marks: 1 }, ...questions.slice(1)] },
    { negativeMarking: 25 }, { passMark: 60 },
  ]) assert.throws(() => validatePublication({ ...policy, ...invalid }));
  assert.doesNotThrow(() => validatePublication({ ...policy, questions: [], isPublished: false }));
});

test('server grading uses percentage points, partial credit and exact pass boundary', () => {
  const paper = { ...policy };
  const answers = Object.fromEntries(questions.slice(0, 35).map(item => [item.id, item.correctAnswer]));
  assert.deepEqual(gradePaper(paper, answers), { score: 70, totalMarks: 100, correctCount: 155, wrongCount: 0, skippedCount: 15, passMark: 70, passed: true });
  answers.q0 = { a: true, b: false, c: true, d: false };
  assert.equal(gradePaper(paper, answers).score, 69.6);
  assert.equal(gradePaper(paper, answers).passed, false);
  const sba = [question('sba', 1), question('sba', 2)];
  assert.equal(gradePaper({ questions: sba, negativeMarking: 25 }, { q1: 'a', q2: 'b' }).score, 1.5);
  assert.equal(gradePaper({ questions: sba }, { q1: 'a', q2: 'b' }).score, 2);
});

test('API persists and snapshots zero deduction and 70 percent pass policy', async () => {
  const context = await fixture();
  try {
    const admin = await context.user('admin');
    const course = (await admin.request('POST', '/admin/courses', { slug: 'policy-course', title: 'Policy course', category: 'FCPS', price: 100 })).json();
    const response = await admin.request('POST', '/admin/exams', { ...policy, courseId: course.id, title: 'Mixed paper', durationMinutes: 60, scheduledAt: '2025-01-01T00:00:00Z' });
    assert.equal(response.statusCode, 200, response.body);
    const exam = response.json();
    assert.equal(exam.totalMarks, 100);
    const started = (await admin.request('POST', `/exams/${exam.id}/start`)).json();
    assert.equal(started.passMark, 70);
    assert.equal(started.negativeMarking, 0);
    const result = (await admin.request('POST', `/exams/${exam.id}/submit`, { answers: {} })).json();
    assert.equal(result.passed, false);
    assert.equal(result.passMark, 70);
  } finally { await context.close(); }
});

test('legacy migration clears quarter defaults, preserves other rates and regrades snapshots once', async () => {
  const database = await openDatabase({ databaseMode: 'pglite', pglitePath: 'memory://' });
  try {
    await database.exec('CREATE TABLE schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    for (const name of ['001_initial.sql', '002_editor_links.sql']) {
      const sql = await readFile(new URL(`../migrations/${name}`, import.meta.url), 'utf8');
      await database.exec(sql);
      await database.query('INSERT INTO schema_migrations(name,checksum) VALUES ($1,$2)', [name, createHash('sha256').update(sql).digest('hex')]);
    }
    const user = await one(database, "INSERT INTO users(mobile,full_name,password_hash) VALUES ('01712345678','Legacy','hash') RETURNING id");
    const course = await one(database, "INSERT INTO courses(slug,title,category,price_minor) VALUES ('legacy','Legacy','FCPS',100) RETURNING id");
    const questions = [question('sba', 1), question('sba', 2)];
    for (const deduction of [0.25, 0.5]) {
      const exam = await one(database, "INSERT INTO exams(course_id,title,duration_minutes,scheduled_at,negative_marking,questions) VALUES ($1,'Legacy',60,now(),$2,$3) RETURNING id", [course.id, deduction, JSON.stringify(questions)]);
      const paper = { questions, negativeMarking: deduction, durationMinutes: 60 };
      await database.query("INSERT INTO exam_attempts(user_id,exam_id,paper,answers,ends_at,submitted_at,result) VALUES ($1,$2,$3,$4,now(),now(),$5)", [user.id, exam.id, JSON.stringify(paper), JSON.stringify({ q1: 'a', q2: 'b' }), JSON.stringify({ score: 2 - 2 * deduction })]);
    }
    const pendingExam = await one(database, "INSERT INTO exams(course_id,title,duration_minutes,scheduled_at) VALUES ($1,'Pending',60,now()) RETURNING id", [course.id]);
    await database.query('INSERT INTO exam_attempts(user_id,exam_id,paper,ends_at) VALUES ($1,$2,$3,now())', [user.id, pendingExam.id, JSON.stringify({ questions, negativeMarking: 0.25 })]);
    await migrate(database);
    await migrate(database);
    const { rows } = await database.query('SELECT x.negative_marking,x.pass_mark,a.paper,a.result FROM exams x JOIN exam_attempts a ON a.exam_id=x.id ORDER BY x.negative_marking');
    assert.equal(rows.filter(row => Number(row.negative_marking) === 0).length, 2);
    const preserved = rows.find(row => Number(row.negative_marking) === 50);
    assert.equal(preserved.paper.negativeMarking, 50);
    assert.equal(preserved.result.score, 1);
    assert.equal(rows.find(row => row.result && Number(row.negative_marking) === 0).result.score, 2);
    for (const row of rows) {
      assert.equal(row.paper.passMark, 70);
      if (row.result) assert.deepEqual(row.result, gradePaper(row.paper, { q1: 'a', q2: 'b' }));
    }
    assert.equal(rows.find(row => row.result === null).paper.negativeMarking, 0);
    const fresh = await one(database, "INSERT INTO exams(course_id,title,duration_minutes,scheduled_at) VALUES ($1,'New',60,now()) RETURNING negative_marking,pass_mark", [course.id]);
    assert.equal(Number(fresh.negative_marking), 0);
    assert.equal(Number(fresh.pass_mark), 70);
  } finally { await database.close(); }
});