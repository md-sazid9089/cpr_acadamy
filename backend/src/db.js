import { mkdir, readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { up as regradeAttempts } from '../migrations/004_regrade_attempts.js';

const migrationSteps = new Map([['004_regrade_attempts.js', regradeAttempts]]);

export async function openDatabase(config) {
  if (config.databaseMode === 'pglite') {
    const { PGlite } = await import('@electric-sql/pglite');
    if (config.pglitePath && config.pglitePath !== 'memory://') await mkdir(dirname(resolve(config.pglitePath)), { recursive: true });
    const database = new PGlite(config.pglitePath);
    await database.waitReady;
    return {
      query: (text, values) => database.query(text, values),
      exec: text => database.exec(text),
      transaction: work => database.transaction(transaction => work({
        query: (text, values) => transaction.query(text, values),
        exec: text => transaction.exec(text),
      })),
      close: () => database.close(),
    };
  }
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10, connectionTimeoutMillis: 5000, statement_timeout: 15000 });
  pool.on('error', () => console.error('Idle PostgreSQL connection failed'));
  return {
    query: (text, values) => pool.query(text, values),
    exec: text => pool.query(text),
    transaction: async work => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await work({ query: (text, values) => client.query(text, values), exec: text => client.query(text) });
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}

export async function migrate(database, directory = resolve(dirname(fileURLToPath(import.meta.url)), '../migrations')) {
  await database.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
  await database.transaction(async transaction => {
    await transaction.exec('LOCK TABLE schema_migrations IN EXCLUSIVE MODE');
    for (const name of (await readdir(directory)).filter(name => /\.(sql|js)$/.test(name)).sort()) {
      const sql = await readFile(join(directory, name), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existing = (await transaction.query('SELECT checksum FROM schema_migrations WHERE name = $1', [name])).rows[0];
      if (existing && existing.checksum !== checksum) throw new Error(`Applied migration was modified: ${name}`);
      if (existing) continue;
      if (name.endsWith('.js')) {
        const up = migrationSteps.get(name);
        if (!up) throw new Error(`Unregistered migration: ${name}`);
        await up(transaction);
      } else {
        await transaction.exec(sql);
      }
      await transaction.query('INSERT INTO schema_migrations(name, checksum) VALUES ($1, $2)', [name, checksum]);
    }
  });
}

export async function one(database, text, values = []) {
  return (await database.query(text, values)).rows[0];
}