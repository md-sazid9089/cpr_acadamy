import { loadConfig } from '../src/config.js';
import { openDatabase, one } from '../src/db.js';

const database = await openDatabase(loadConfig());
try {
  await database.exec(`UPDATE users SET password_hash = (SELECT password_hash FROM users WHERE mobile = '01333333333') WHERE mobile = '01722222222'`);
  await database.exec(`UPDATE users SET password_hash = (SELECT password_hash FROM users WHERE mobile = '01333333333') WHERE mobile = '01711111111'`);
  console.log('updated');
} catch(e) {
  console.error(e);
} finally {
  await database.close();
}
