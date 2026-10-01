import https from 'node:https';
import net from 'node:net';
import { lookup as dnsLookup } from 'node:dns';
import { Readable } from 'node:stream';

/**
 * Fetching a URL an admin typed in (lecture video/notes) on the server's behalf must never reach the
 * server's own network: loopback, private ranges, link-local cloud metadata (169.254.169.254) and the
 * like. Redirects are followed by hand so every hop is checked, and addresses are checked at connect
 * time (not just on the first lookup) so DNS rebinding cannot swap in a private one.
 */
export class BlockedAddressError extends Error {
  constructor(message = 'That address is not allowed.') {
    super(message);
    this.name = 'BlockedAddressError';
    this.code = 'EBLOCKED';
  }
}

function ipv4ToNumber(address) {
  return address.split('.').reduce((total, part) => total * 256 + Number(part), 0);
}

const ipv4Blocked = [
  '0.0.0.0/8', '10.0.0.0/8', '100.64.0.0/10', '127.0.0.0/8', '169.254.0.0/16', '172.16.0.0/12',
  '192.0.0.0/24', '192.168.0.0/16', '198.18.0.0/15', '224.0.0.0/4', '240.0.0.0/4',
].map(cidr => {
  const [base, bits] = cidr.split('/');
  return { start: ipv4ToNumber(base), size: 2 ** (32 - Number(bits)) };
});

/** True only for globally routable unicast addresses. */
export function isPublicAddress(address) {
  const family = net.isIP(address);
  if (family === 4) {
    const number = ipv4ToNumber(address);
    return !ipv4Blocked.some(({ start, size }) => number >= start && number < start + size);
  }
  if (family !== 6) return false;
  const value = address.toLowerCase();
  const mapped = value.match(/^(?:::ffff:|64:ff9b::)(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPublicAddress(mapped[1]);
  if (value === '::' || value === '::1') return false;
  const first = parseInt(value.split(':')[0] || '0', 16);
  if ((first & 0xfe00) === 0xfc00) return false; // fc00::/7 unique local
  if ((first & 0xffc0) === 0xfe80) return false; // fe80::/10 link local
  if ((first & 0xff00) === 0xff00) return false; // ff00::/8 multicast
  if (value.startsWith('2001:db8')) return false; // documentation
  return true;
}

/** Cheap check for a URL on its face: HTTPS, no credentials, and no private IP literal or `localhost`. */
export function isAllowedMediaUrl(value) {
  let url;
  try { url = new URL(value); } catch { return false; }
  if (url.protocol !== 'https:' || url.username || url.password) return false;
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) return false;
  return net.isIP(host) === 0 || isPublicAddress(host);
}

/** `dns.lookup` that refuses to hand back anything but public addresses. */
export function guardedLookup(hostname, options, callback) {
  const wantAll = typeof options === 'object' && options.all;
  dnsLookup(hostname, { ...(typeof options === 'object' ? options : {}), all: true }, (error, addresses) => {
    if (error) return callback(error);
    const allowed = addresses.filter(entry => isPublicAddress(entry.address));
    if (!allowed.length) return callback(new BlockedAddressError());
    return wantAll ? callback(null, allowed) : callback(null, allowed[0].address, allowed[0].family);
  });
}

function httpsTransport(url, { headers, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, { method: 'GET', headers, lookup: guardedLookup, timeout: timeoutMs }, response => {
      resolve({ status: response.statusCode, headers: response.headers, body: response });
    });
    request.on('timeout', () => request.destroy(Object.assign(new Error('Upstream timed out'), { code: 'ETIMEDOUT' })));
    request.on('error', reject);
    request.end();
  });
}

/**
 * GET `url` and stream the answer back as a web `Response`. Throws BlockedAddressError for forbidden
 * targets and plain errors for network trouble; `transport` is injectable for tests.
 */
export async function safeFetch(url, { headers = {}, timeoutMs = 15000, maxRedirects = 3, transport = httpsTransport } = {}) {
  let target = url;
  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    if (!isAllowedMediaUrl(target)) throw new BlockedAddressError();
    const upstream = await transport(new URL(target), { headers, timeoutMs });
    if (upstream.status >= 300 && upstream.status < 400 && upstream.headers.location) {
      upstream.body?.destroy?.();
      target = new URL(upstream.headers.location, target).toString();
      continue;
    }
    const body = upstream.body ? (upstream.body instanceof Readable ? Readable.toWeb(upstream.body) : upstream.body) : null;
    return { status: upstream.status, headers: upstream.headers, body };
  }
  throw new BlockedAddressError('Too many redirects.');
}
