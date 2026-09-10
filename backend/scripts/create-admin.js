import { z } from 'zod';
import { loadConfig } from '../src/config.js';
import { openDatabase, one } from '../src/db.js';
import { hashPassword } from '../src/security.js';
import { mobile, password, text, audit } from '../src/http.js';

const input = z.object({ mobile, password: password.min(12), fullName: text }).safeParse({ mobile: process.env.ADMIN_MOBILE, password: process.env.ADMIN_PASSWORD, fullName: process.env.ADMIN_NAME });
if (!input.success) {
  console.error('Set ADMIN_MOBILE, ADMIN_NAME, and ADMIN_PASSWORD (at least 12 characters) privately in your terminal. No default administrator exists.');
  process.exitCode = 1;
} else {
  const database = await openDatabase(loadConfig());
  try {
    const hash = await hashPassword(input.data.password);
    await database.transaction(async transaction => {
      const user = await one(transaction, "INSERT INTO users(mobile,full_name,password_hash,role,status,mobile_verified_at) VALUES ($1,$2,$3,'admin','active',now()) RETURNING id", [input.data.mobile, input.data.fullName, hash]);
      await audit(transaction, user.id, 'admin.bootstrapped', user.id);
    });
    console.log('Administrator created. Clear ADMIN_PASSWORD from your terminal environment.');
  } catch (error) {
    console.error(error.code === '23505' ? 'That mobile number is already registered. No account was modified.' : 'Administrator creation failed. Check database configuration and migrations.');
    process.exitCode = 1;
  } finally {
    delete process.env.ADMIN_PASSWORD;
    await database.close();
  }
}