import { handleRequest } from '../../../src/runtime.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handleRequest;
export const HEAD = handleRequest;
export const POST = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
export const PUT = handleRequest;
export const OPTIONS = handleRequest;