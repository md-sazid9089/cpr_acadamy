/**
 * Demo and maintenance scripts create accounts with published passwords or copy password hashes around.
 * They must never run against a production database: production is refused outright, and any other
 * PostgreSQL database needs an explicit ALLOW_DEMO_SEED=true. The embedded development database is always fine.
 */
export function requireDevelopmentDatabase(config, scriptName) {
  const allowed = !config.production && (config.databaseMode === 'pglite' || process.env.ALLOW_DEMO_SEED === 'true');
  if (allowed) return;
  console.error(`${scriptName} is for development databases only and refuses to run against ${config.production ? 'production' : 'a PostgreSQL database'} (set ALLOW_DEMO_SEED=true to use it on a non-production one).`);
  process.exit(1);
}
