import { loadConfig } from '../src/config.js';
import { openDatabase, migrate } from '../src/db.js';

const database = await openDatabase(loadConfig());
try {
  await migrate(database);
  console.log('Database migrations applied.');
} finally {
  await database.close();
}