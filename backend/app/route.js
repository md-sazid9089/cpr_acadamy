export function GET() {
  return Response.json({ service: 'CPR Academy API', version: '0.1.0', health: '/api/health', readiness: '/api/ready', contract: '/api/openapi.json' });
}