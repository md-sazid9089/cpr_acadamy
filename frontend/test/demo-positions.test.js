import assert from 'node:assert/strict';
import test from 'node:test';
import { demoExams, demoPositions } from '../src/features/exams/demo-positions.js';

test('sample standings contain realistic, consistent ranks, ties, scores and pagination', () => {
  assert.equal(new Set(demoExams.map(exam => exam.courseId)).size, 2);
  for (const exam of demoExams) {
    const full = demoPositions(exam.id, { limit: 50 });
    assert.equal(full.participants, 36);
    assert.equal(new Set(full.items.map(entry => entry.name)).size, 36);
    assert.deepEqual(full.items.slice(0, 4).map(entry => entry.rank), [1, 2, 2, 4]);
    assert.equal(full.items.filter(entry => entry.isMe).length, 1);
    assert.equal(full.me.name, 'Arif Hasan');
    assert.equal(full.items.some(entry => !entry.passed), true);
    for (const entry of full.items) {
      assert.equal(entry.rank, 1 + full.items.filter(other => other.score > entry.score).length);
      assert.equal(entry.tied, full.items.filter(other => other.score === entry.score).length > 1);
      assert.equal(entry.passed, entry.score * 100 >= entry.totalMarks * 70);
      assert.ok(entry.score >= 0 && entry.score <= entry.totalMarks);
    }
    const second = demoPositions(exam.id, { limit: 10, offset: 10 });
    assert.deepEqual(second.items, full.items.slice(10, 20));
    assert.deepEqual(second.me, full.me);
    assert.equal(full.highestScore, full.items[0].score);
    assert.equal(full.averageScore, Math.round(full.items.reduce((sum, entry) => sum + entry.score, 0) / 36 * 1000) / 1000);
  }
  assert.equal(demoPositions('demo-medicine').provisional, false);
  assert.equal(demoPositions('demo-anatomy').provisional, true);
  assert.equal(demoPositions('demo-anatomy').pending, 4);
  assert.throws(() => demoPositions('not-an-exam'), /Sample exam not found/);
});