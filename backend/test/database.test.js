import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase, migrate, one } from '../src/db.js';
import { loadConfig } from '../src/config.js';

const migrationCount = (await readdir(new URL('../migrations', import.meta.url))).filter(name => /\.(sql|js)$/.test(name)).length;

test('migrations are repeatable and the database enforces financial and identity constraints', async () => {
  const database = await openDatabase({ databaseMode: 'pglite', pglitePath: 'memory://' });
  try {
    await migrate(database);
    await migrate(database);
    assert.equal((await one(database, 'SELECT count(*)::int AS count FROM schema_migrations')).count, migrationCount);
    await assert.rejects(database.query("INSERT INTO users(mobile,full_name,password_hash) VALUES ('bad','Test','hash')"), { code: '23514' });
    await assert.rejects(database.query("INSERT INTO courses(slug,title,category,price_minor) VALUES ('bad','Test','FCPS',-1)"), { code: '23514' });
  } finally {
    await database.close();
  }
});

test('production refuses embedded storage and missing secrets', () => {
  assert.throws(() => loadConfig({ NODE_ENV: 'production', DATABASE_MODE: 'pglite' }), /PostgreSQL/);
  assert.throws(() => loadConfig({ NODE_ENV: 'production', DATABASE_URL: 'postgres://localhost/test' }), /TOKEN_SECRET/);
  const production = { NODE_ENV: 'production', DATABASE_URL: 'postgres://localhost/test', TOKEN_SECRET: 'x'.repeat(32), CORS_ORIGINS: 'https://app.example' };
  assert.throws(() => loadConfig(production), /TRUST_PROXY/);
  assert.throws(() => loadConfig({ ...production, TRUST_PROXY: 'yes' }), /TRUST_PROXY/);
  assert.equal(loadConfig({ ...production, TRUST_PROXY: 'true' }).trustProxy, true);
  assert.equal(loadConfig({ ...production, TRUST_PROXY: 'false' }).trustProxy, false);
  assert.throws(() => loadConfig({ SMS_MODE: 'test' }), /only allowed in tests/);
});

test('local database creates missing parent directories and persists data across restarts', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'cpr-database-'));
  const config = { databaseMode: 'pglite', pglitePath: join(directory, 'new', 'nested', 'database') };
  let database;
  try {
    database = await openDatabase(config);
    await migrate(database);
    await database.close();
    database = await openDatabase(config);
    assert.equal((await one(database, 'SELECT count(*)::int AS count FROM schema_migrations')).count, migrationCount);
  } finally {
    if (database) await database.close();
    await rm(directory, { recursive: true, force: true });
  }
});