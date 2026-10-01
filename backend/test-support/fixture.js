import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase, migrate, one } from '../src/db.js';
import { loadConfig } from '../src/config.js';
import { buildApp } from '../src/app.js';
import { hashPassword } from '../src/security.js';

export async function fixture() {
  const database = await openDatabase({ databaseMode: 'pglite', pglitePath: 'memory://' });
  await migrate(database);
  // Uploads from tests go to a throwaway folder, not the project's public/uploads.
  const config = loadConfig({ NODE_ENV: 'test', SMS_MODE: 'test', TOKEN_SECRET: 'test-secret-with-at-least-32-characters', UPLOAD_DIR: join(tmpdir(), 'cpr-academy-test-uploads') });
  const app = await buildApp({ database, config });
  async function user(role = 'student', mobile = '01712345678', status = 'active') {
    const password = 'Synthetic-test-password';
    const row = await one(database, `INSERT INTO users(mobile,full_name,password_hash,role,status,mobile_verified_at)
      VALUES ($1,'Test User',$2,$3,$4,now()) RETURNING id`, [mobile, await hashPassword(password), role, status]);
    const response = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { 'x-device-id': 'fixture-device' }, payload: { mobile, password } });
    if (response.statusCode !== 200) throw new Error(response.body);
    const headers = { 'x-device-id': 'fixture-device', authorization: `Bearer ${response.json().accessToken}` };
    return { id: row.id, headers, request: (method, path, payload, extra = {}) => app.inject({ method, url: `/api${path}`, headers: { ...headers, ...extra }, payload }) };
  }
  return { database, config, app, user, close: async () => { await app.close(); await database.close(); } };
}