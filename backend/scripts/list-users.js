import { loadConfig } from '../src/config.js';
import { openDatabase } from '../src/db.js';
import { requireDevelopmentDatabase } from './dev-only.js';

const config = loadConfig();
requireDevelopmentDatabase(config, 'list-users');
const database = await openDatabase(config);
try {
  // Never password hashes: this output ends up in terminals and chat logs.
  const { rows: users } = await database.query('SELECT id,mobile,full_name,role,status,created_at,last_login_at FROM users ORDER BY created_at');
  console.table(users);
} catch (error) {
  console.error(error);
} finally {
  await database.close();
}
