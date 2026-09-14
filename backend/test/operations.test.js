import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../test-support/fixture.js';
import { buildApp } from '../src/app.js';
import { runMaintenance } from '../src/worker.js';
import { one } from '../src/db.js';

test('readiness, generated contracts, closed SMS, and background exam finalization', async () => {
  const context = await fixture();
  let disabledApp;
  try {
    let response = await context.app.inject('/api/ready');
    assert.equal(response.statusCode, 200);
    response = await context.app.inject('/api/openapi.json');
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().openapi, '3.0.3');
    assert.equal(response.json().paths['/api/auth/register'].post.requestBody.required, true);
    assert.ok(response.json().paths['/api/admin/payments/{id}/confirm']);
    disabledApp = await buildApp({ database: context.database, config: { ...context.config, smsMode: 'disabled' } });
    response = await disabledApp.inject({ method: 'POST', url: '/api/auth/register', payload: { mobile: '01712345678', password: 'Registration-password', fullName: 'Test Student', institution: 'Medical College', interest: 'FCPS', acceptTerms: true } });
    assert.equal(response.statusCode, 503);
    assert.equal((await one(context.database, 'SELECT count(*)::int AS count FROM users')).count, 0);
    const user = await context.user();
    const course = await one(context.database, "INSERT INTO courses(slug,title,category,price_minor) VALUES ('ops-course','Ops','FCPS',100) RETURNING id");
    const exam = await one(context.database, "INSERT INTO exams(course_id,title,duration_minutes,scheduled_at) VALUES ($1,'Ops Exam',10,now()) RETURNING id", [course.id]);
    await context.database.query("INSERT INTO exam_attempts(user_id,exam_id,paper,ends_at) VALUES ($1,$2,$3,now()-interval '1 second')", [user.id, exam.id, JSON.stringify({ questions: [], negativeMarking: 0.25 })]);
    await runMaintenance(context.database, context.config, () => {});
    assert.ok((await one(context.database, 'SELECT submitted_at FROM exam_attempts')).submitted_at);
  } finally {
    if (disabledApp) await disabledApp.close();
    await context.close();
  }
});