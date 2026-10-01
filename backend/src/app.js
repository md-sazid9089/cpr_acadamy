import { createWebApp } from './web-app.js';
import { installRoutes } from './http.js';
import { authRoutes } from './modules/auth.js';
import { courseRoutes } from './modules/courses.js';
import { billingRoutes } from './modules/billing.js';
import { examRoutes } from './modules/exams.js';
import { studentRoutes } from './modules/students.js';
import { reportRoutes } from './modules/reports.js';
import { mediaRoutes } from './modules/media.js';
import { galleryRoutes } from './modules/gallery.js';

export async function buildApp({ database, config, logger = false }) {
  const app = createWebApp({ database, config, logger });
  const contract = { openapi: '3.0.3', info: { title: 'CPR Academy API', version: '0.1.0', description: 'Opaque bearer sessions bound to X-Device-Id. Money responses use BDT; storage uses integer poisha. Collections accept limit/offset. Admin mutations are audited. Manual payment reconciliation is supported; online providers are not configured.' },
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' }, deviceId: { type: 'apiKey', in: 'header', name: 'X-Device-Id' } } }, paths: {} };
  const route = installRoutes(app, database, config, contract);
  route('GET', '/health', {}, async () => ({ status: 'ok' }));
  route('GET', '/ready', {}, async (request, reply) => {
    try {
      await database.query('SELECT 1 FROM schema_migrations LIMIT 1');
      // The worker beats every 10 seconds. A stale beat does not take the web service down, but monitoring
      // should alert on worker !== 'ok': without it no SMS/email is delivered and abandoned exams stay open.
      const beat = await database.query("SELECT extract(epoch FROM now()-beat_at) AS age FROM worker_heartbeat WHERE id=1");
      const worker = beat.rows.length === 0 ? 'unknown' : Number(beat.rows[0].age) <= 60 ? 'ok' : 'stale';
      return { status: 'ready', worker };
    } catch {
      return reply.code(503).send({ status: 'not_ready' });
    }
  });
  authRoutes(route, database, config);
  courseRoutes(route, database, config);
  billingRoutes(route, database, config);
  examRoutes(route, database);
  studentRoutes(route, database, config);
  reportRoutes(route, database);
  mediaRoutes(route, config);
  galleryRoutes(route, database);
  route('GET', '/openapi.json', config.production ? { auth: 'admin' } : {}, async () => contract);
  return app;
}
