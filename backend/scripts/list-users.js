import { loadConfig } from '../src/config.js';
import { openDatabase, many } from '../src/db.js';

const database = await openDatabase(loadConfig());
try {
  const users = await many(database, 'SELECT * FROM users');
  console.log(users);
} catch(e) {
  console.error(e);
} finally {
  await database.close();
}
