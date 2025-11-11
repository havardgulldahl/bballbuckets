// src/index.ts
const ORIGIN = 'https://havardgulldahl.github.io/bballbuckets';
const MAX_AGE = 86400; // 24h

export default {
  async fetch(req: Request, env: unknown, ctx: ExecutionContext): Promise<Response> {
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(req.url);
    // Map proxy path to upstream
    const upstreamUrl = new URL(url.pathname + url.search, ORIGIN);

    // Cache key without noisy headers
    const cache = caches.default;
    const cacheKey = new Request(upstreamUrl.toString(), { method: 'GET' });

    const cached = await cache.match(cacheKey);
    if (cached) return addCors(cached);

    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: req.headers.get('Accept') ?? '*/*',
      },
      // Cloudflare hint
      cf: { cacheTtl: MAX_AGE, cacheEverything: true },
    });

    // Normalize cache headers to force 24h cache
    const h = new Headers(upstreamRes.headers);
    h.set('Cache-Control', `public, max-age=${MAX_AGE}, s-maxage=${MAX_AGE}, immutable`);

    const proxied = new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: h,
    });

    ctx.waitUntil(cache.put(cacheKey, proxied.clone()));
    return addCors(proxied);
  },
};

function addCors(resp: Response): Response {
  const h = new Headers(resp.headers);
  h.set('Access-Control-Allow-Origin', '*'); // or your exact origin
  // Keep Vary sane
  const vary = h.get('Vary');
  if (!vary) h.set('Vary', 'Origin');
  else if (!vary.toLowerCase().split(',').map(s => s.trim()).includes('origin')) {
    h.set('Vary', vary + ', Origin');
  }
  return new Response(resp.body, { status: resp.status, headers: h });
}
