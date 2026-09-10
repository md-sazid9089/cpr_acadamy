import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: {
  port: { type: 'string', default: process.env.PORT || '3001' },
  hostname: { type: 'string', default: process.env.HOSTNAME || '0.0.0.0' },
} });
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
process.env.PORT = String(port);
process.env.HOSTNAME = values.hostname;
await import('../.next/standalone/server.js');