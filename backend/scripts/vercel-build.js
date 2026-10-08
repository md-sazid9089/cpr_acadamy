import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

// Vercel runs `npm run vercel-build` instead of `build`. Production deployments apply pending
// migrations first, so the new code never runs against an old schema. Preview deployments do not:
// they usually share the production database, and a branch must not change its schema.
const run = args => {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

if (process.env.VERCEL_ENV === 'production') run(['scripts/migrate.js']);
else console.info(`Skipping database migrations for a ${process.env.VERCEL_ENV || 'local'} build.`);
run([createRequire(import.meta.url).resolve('next/dist/bin/next'), 'build', '--webpack']);
