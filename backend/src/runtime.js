import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { loadConfig } from './config.js';
import { openDatabase, migrate } from './db.js';
import { buildApp } from './app.js';
import { startWorker } from './worker.js';

const runtimeKey = Symbol.for('cpr-academy.runtime');
let application;
const logger = {
  info: (...values) => console.info(...values),
  warn: (...values) => console.warn(...values),
  error: (...values) => console.error(...values),
};

async function initialize() {
  const config = loadConfig();
  const database = await openDatabase(config);
  try {
    if (!config.production) await migrate(database, resolve(process.cwd(), 'migrations'));
    await database.query('SELECT name FROM schema_migrations LIMIT 1');
    if (config.ephemeralSecret) logger.warn('TOKEN_SECRET is unset; restarting invalidates sessions and queued SMS.');
    if (config.smsMode === 'disabled') logger.warn('SMS is disabled; registration and password recovery are unavailable. Set SMS_MODE=console for local development.');
    if (config.smsMode === 'console') logger.warn('SMS_MODE=console: verification codes are printed to this terminal instead of being sent.');
    const stopWorker = config.production ? async () => {} : startWorker(database, config, logger);
    const runtime = { database, config, stopWorker };
    const shutdown = async () => { await stopWorker(); await database.close(); };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
    return runtime;
  } catch (error) {
    await database.close();
    throw error;
  }
}

export async function handleRequest(request) {
  try {
    globalThis[runtimeKey] ??= initialize().catch(error => {
      delete globalThis[runtimeKey];
      throw error;
    });
    application ??= globalThis[runtimeKey].then(runtime => buildApp({ ...runtime, logger })).catch(error => {
      application = undefined;
      throw error;
    });
    const app = await application;
    return await app.handle(request);
  } catch (error) {
    const requestId = randomUUID();
    logger.error({ requestId, code: error.code, errorType: error.name }, 'API initialization failed');
    return Response.json({ code: 'SERVICE_UNAVAILABLE', message: 'The service is temporarily unavailable.', requestId }, {
      status: 503, headers: { 'cache-control': 'no-store', 'retry-after': '10', 'x-request-id': requestId },
    });
  }
}