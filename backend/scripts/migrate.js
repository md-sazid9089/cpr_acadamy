import { loadConfig } from '../src/config.js';
import { openDatabase, migrate } from '../src/db.js';

const config = loadConfig();
// A Vercel build has no disk worth keeping: migrating the embedded database there would report
// success while the real database stayed on the old schema.
if (process.env.VERCEL && config.databaseMode !== 'postgres') throw new Error('On Vercel, migrations must run against PostgreSQL (set DATABASE_URL)');
const database = await openDatabase(config);
try {
  await migrate(database);
  const target = config.databaseMode === 'postgres' ? `PostgreSQL at ${new URL(config.databaseUrl).hostname}` : `the local database (${config.pglitePath})`;
  console.log(`Database migrations applied to ${target}.`);
} finally {
  await database.close();
}