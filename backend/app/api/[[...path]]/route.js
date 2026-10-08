import { after } from 'next/server';
import { handleRequest, runAfterRequest } from '../../../src/runtime.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// With WORKER_MODE=serverless, background work (SMS/email delivery, exam finalisation,
// clean-up) runs once the response is on its way, since nothing else keeps running on Vercel.
async function handler(request) {
  const response = await handleRequest(request);
  after(() => runAfterRequest(request.method));
  return response;
}

export const GET = handler;
export const HEAD = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
export const PUT = handler;
export const OPTIONS = handler;
