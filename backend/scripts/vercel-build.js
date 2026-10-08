import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

// Vercel runs `npm run vercel-build` instead of `build`. Production deployments apply pending
// migrations first, so the new code never runs against an old schema. Preview deployments do not:
// they usually share the production database, and a branch must not change its schema.
const run = (args, env = process.env) => {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', env });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

// NODE_ENV is not necessarily 'production' yet at this point of the build, and without it the
// config would pick the throwaway local database. Forcing it makes the migration reach PostgreSQL
// (and fail loudly if DATABASE_URL or another production setting is missing).
if (process.env.VERCEL_ENV === 'production') run(['scripts/migrate.js'], { ...process.env, NODE_ENV: 'production' });
else console.info(`Skipping database migrations for a ${process.env.VERCEL_ENV || 'local'} build.`);
run([createRequire(import.meta.url).resolve('next/dist/bin/next'), 'build', '--webpack']);
