import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const productionEnv = { PATH: process.env.PATH, NODE_ENV: 'production', DATABASE_URL: 'postgres://nobody:nothing@127.0.0.1:1/none', TOKEN_SECRET: 'x'.repeat(40), CORS_ORIGINS: 'https://app.example', TRUST_PROXY: 'true', WORKER_MODE: 'embedded' };
const run = (script, env) => spawnSync(process.execPath, [`scripts/${script}`], { env, encoding: 'utf8', timeout: 20000 });

test('demo seeds and dev scripts refuse to touch a production or PostgreSQL database', () => {
  for (const script of ['seed-demo.js', 'seed-demo-course.js', 'list-users.js', 'update-passwords.js']) {
    for (const env of [productionEnv, { ...productionEnv, NODE_ENV: 'production', ALLOW_DEMO_SEED: 'true' }, { PATH: process.env.PATH, DATABASE_MODE: 'postgres', DATABASE_URL: 'postgres://nobody:nothing@127.0.0.1:1/none' }]) {
      const result = run(script, env);
      assert.equal(result.status, 1, `${script}: ${result.stderr}`);
      assert.match(result.stderr, /development databases only/, script);
    }
  }
});

test('the user listing never selects password hashes', () => {
  const source = readFileSync(new URL('../scripts/list-users.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /SELECT\s+\*/i);
  assert.doesNotMatch(source, /password_hash/);
});
