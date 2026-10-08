import { handleCron } from '../../../../src/runtime.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Vercel Cron calls this with "Authorization: Bearer $CRON_SECRET" (see vercel.json). It is the
// fallback for quiet periods, when no request comes in to trigger the after-response maintenance.
export const GET = handleCron;
