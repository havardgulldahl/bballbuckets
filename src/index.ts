// src/index.ts
// CORS Proxy for NIF Basketball Federation API
// Matches the endpoints defined in docs/nif.js

const NIF_API_BASE = 'https://sf14-terminlister-prod-app.azurewebsites.net/ta';
const BASKETBALL_SPORT_ID = 199;
const MAX_AGE = 86400; // 1 day cache

// Headers to forward to NIF API (matching docs/nif.js)
const NIF_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://kamper.basket.no',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'cross-site',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0.1 Safari/605.1.15'
};

interface Env {
  // Add environment variables here if needed
}

// Cloudflare Workers types
interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(),
      });
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
      return corsResponse(
        new Response('Method Not Allowed', { status: 405 })
      );
    }

    const url = new URL(req.url);
    const path = url.pathname;

    try {
      // Route to appropriate NIF API endpoint
      // Matching the methods from docs/nif.js:
      // - getSeasons(year) -> /Seasons/?sportId=199&year={year}
      // - getTournamentsBySeason(seasonId) -> /Tournament/Season/{seasonId}
      // - getTeamsByTournament(tournamentId) -> /TournamentTeams/?tournamentId={tournamentId}
      // - getMatchesByTournament(tournamentId) -> /TournamentMatches/?tournamentId={tournamentId}
      // - getTeamMembers(teamId) -> /TeamMembers/{teamId}

      let nifPath: string;
      let cacheKey: string;

      if (path.startsWith('/api/seasons')) {
        // GET /api/seasons?year=2025
        const year = url.searchParams.get('year') || new Date().getFullYear().toString();
        nifPath = `/Seasons/?sportId=${BASKETBALL_SPORT_ID}&year=${year}`;
        cacheKey = `seasons:${year}`;
      } else if (path.startsWith('/api/tournaments/')) {
        // GET /api/tournaments/{seasonId}
        const seasonId = path.split('/')[3];
        if (!seasonId) {
          return corsResponse(new Response('Missing seasonId', { status: 400 }));
        }
        nifPath = `/Tournament/Season/${seasonId}`;
        cacheKey = `tournaments:${seasonId}`;
      } else if (path.startsWith('/api/teams/')) {
        // GET /api/teams/{tournamentId}
        const tournamentId = path.split('/')[3];
        if (!tournamentId) {
          return corsResponse(new Response('Missing tournamentId', { status: 400 }));
        }
        nifPath = `/TournamentTeams/?tournamentId=${tournamentId}`;
        cacheKey = `teams:${tournamentId}`;
      } else if (path.startsWith('/api/matches/')) {
        // GET /api/matches/{tournamentId}
        const tournamentId = path.split('/')[3];
        if (!tournamentId) {
          return corsResponse(new Response('Missing tournamentId', { status: 400 }));
        }
        nifPath = `/TournamentMatches/?tournamentId=${tournamentId}`;
        cacheKey = `matches:${tournamentId}`;
      } else if (path.startsWith('/api/members/')) {
        // GET /api/members/{teamId}
        const teamId = path.split('/')[3];
        if (!teamId) {
          return corsResponse(new Response('Missing teamId', { status: 400 }));
        }
        nifPath = `/TeamMembers/${teamId}`;
        cacheKey = `members:${teamId}`;
      } else {
        return corsResponse(
          new Response('Not Found. Available endpoints: /api/seasons, /api/tournaments/{seasonId}, /api/teams/{tournamentId}, /api/matches/{tournamentId}, /api/members/{teamId}', 
            { status: 404 }
          )
        );
      }

      // Check cache first (Cloudflare Workers Cache API)
      const cache = (caches as any).default;
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        console.log(`Cache HIT: ${cacheKey}`);
        return corsResponse(cachedResponse);
      }

      console.log(`Cache MISS: ${cacheKey}, fetching from NIF API`);

      // Fetch from NIF API
      const nifUrl = `${NIF_API_BASE}${nifPath}`;
      const nifResponse = await fetch(nifUrl, {
        method: 'GET',
        headers: NIF_HEADERS,
      });

      if (!nifResponse.ok) {
        return corsResponse(
          new Response(
            JSON.stringify({ 
              error: 'NIF API Error', 
              status: nifResponse.status,
              statusText: nifResponse.statusText 
            }), 
            { 
              status: nifResponse.status,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        );
      }

      // Clone response for caching
      const responseData = await nifResponse.json();
      const responseBody = JSON.stringify(responseData);

      // Create response with cache headers
      const response = new Response(responseBody, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${MAX_AGE}, s-maxage=${MAX_AGE}`,
        },
      });

      // Cache the response
      ctx.waitUntil(cache.put(cacheKey, response.clone()));

      return corsResponse(response);

    } catch (error) {
      console.error('Proxy error:', error);
      return corsResponse(
        new Response(
          JSON.stringify({ 
            error: 'Internal Server Error', 
            message: error instanceof Error ? error.message : 'Unknown error' 
          }), 
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      );
    }
  },
};

/**
 * Get CORS headers for preflight requests
 */
function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Origin',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Add CORS headers to a response
 */
function corsResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept, Origin');
  
  // Maintain Vary header for proper caching
  const vary = headers.get('Vary');
  if (!vary) {
    headers.set('Vary', 'Origin');
  } else if (!vary.toLowerCase().includes('origin')) {
    headers.set('Vary', `${vary}, Origin`);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
