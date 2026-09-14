import { loadConfig } from '../src/config.js';
import { openDatabase } from '../src/db.js';
import { startWorker } from '../src/worker.js';

const config = loadConfig();
if (config.databaseMode !== 'postgres') throw new Error('A separate worker requires PostgreSQL; Next.js runs the embedded development worker.');
const database = await openDatabase(config);
try {
  await database.query('SELECT name FROM schema_migrations LIMIT 1');
  const stopWorker = startWorker(database, config, console, { persistent: true });
  let stopping = false;
  const shutdown = async () => {
    if (stopping) return;
    stopping = true;
    await stopWorker();
    await database.close();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  console.info('CPR Academy background worker started.');
} catch (error) {
  await database.close();
  console.error('Worker startup failed:', error.code || error.name);
  process.exitCode = 1;
}