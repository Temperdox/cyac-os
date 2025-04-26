// worker/index.ts
// Remove the parseCookie import if not needed
// import { parse as parseCookie } from 'cookie';

// Cloudflare worker environment variables
interface Env {
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_REDIRECT_URI_CYAC_ME: string;
  DISCORD_REDIRECT_URI_CYBERAC_ME: string;
  DISCORD_REDIRECT_URI_WORKER: string;
  JWT_SECRET: string;
  SESSION_SECRET: string;
  // Add a NODE_ENV property if needed
  NODE_ENV?: string;
}

// Define TokenResponse interface
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

// Define UserInfo interface
interface UserInfo {
  id: string;
  username: string;
  avatar?: string;
  discriminator: string;
  [key: string]: any;
}

// JWT signing helper
async function signJwt(payload: any, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
  );

  const toBase64Url = (buffer: ArrayBuffer): string =>
      btoa(String.fromCharCode(...new Uint8Array(buffer)))
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_');

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerSeg = toBase64Url(encoder.encode(JSON.stringify(header)));
  const payloadSeg = toBase64Url(encoder.encode(JSON.stringify(payload)));

  const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(`${headerSeg}.${payloadSeg}`)
  );
  const sigSeg = toBase64Url(signature);

  return `${headerSeg}.${payloadSeg}.${sigSeg}`;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '*';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400' // 24 hours
        }
      });
    }

    // Common CORS+JSON headers
    const CORS_JSON = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Content-Type': 'application/json'
    };

    try {
      // Determine the correct redirect URI based on hostname
      const getRedirectUri = (hostname: string): string => {
        if (hostname.includes('cyberac.me')) {
          return env.DISCORD_REDIRECT_URI_CYBERAC_ME;
        } else if (hostname.includes('cyac.me')) {
          return env.DISCORD_REDIRECT_URI_CYAC_ME;
        } else {
          return env.DISCORD_REDIRECT_URI_WORKER;
        }
      };

      // Token exchange endpoint
      if (url.pathname === '/auth/discord/token' && request.method === 'POST') {
        try {
          const payload_token = await request.json() as { code: string };
          const code = payload_token.code;

          if (!code) {
            return Response.json(
                { error: 'Missing code parameter' },
                { status: 400, headers: CORS_JSON }
            );
          }

          // Get hostname from URL or Origin header for redirect URI
          const hostname = url.hostname || (origin !== '*' ? new URL(origin).hostname : '');
          const REDIRECT_URI = getRedirectUri(hostname);

          const params = new URLSearchParams({
            client_id: env.DISCORD_CLIENT_ID,
            client_secret: env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
          });

          const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
          });

          if (!tokenRes.ok) {
            const errorText = await tokenRes.text();

            return Response.json({
              error: 'Token exchange failed',
              status: tokenRes.status,
              details: errorText,
              redirect_uri_used: REDIRECT_URI
            }, { status: tokenRes.status, headers: CORS_JSON });
          }

          const tokenData = await tokenRes.json() as TokenResponse;

          // Fetch the Discord user for the JWT
          const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
          });

          if (!userRes.ok) {
            return Response.json({
              error: 'Failed to fetch user info',
              status: userRes.status
            }, { status: userRes.status, headers: CORS_JSON });
          }

          const userInfo = await userRes.json() as UserInfo;

          // Build JWT payload with 24h refresh and 14-day expiration
          const now = Math.floor(Date.now() / 1000);
          const payload = {
            discordId: userInfo.id,
            refreshAfter: now + 24 * 3600,              // 24 hours
            iat: now,                                   // issued at
            exp: now + 14 * 24 * 3600                   // 14 days
          };

          // Sign JWT with secret
          const jwt = await signJwt(payload, env.JWT_SECRET);

          // Return tokens, JWT, and user info
          return Response.json({
            ...tokenData,
            jwt,
            user: userInfo
          }, { status: 200, headers: CORS_JSON });
        } catch (error) {
          const err = error as Error;
          return Response.json({
            error: 'Token exchange failed',
            message: err.message || 'Unknown error'
          }, { status: 500, headers: CORS_JSON });
        }
      }

      // User info endpoint for refreshing
      if (url.pathname === '/auth/me') {
        try {
          const authHeader = request.headers.get('Authorization') || '';
          const token = authHeader.replace('Bearer ', '');

          if (!token) {
            return Response.json(
                { error: 'No authorization token provided' },
                { status: 401, headers: CORS_JSON }
            );
          }

          // Get user info from Discord API
          const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
            headers: { 'Authorization': authHeader }
          });

          if (!userResponse.ok) {
            return Response.json({
              error: 'Failed to fetch user info',
              details: `Discord API returned ${userResponse.status}`
            }, { status: userResponse.status, headers: CORS_JSON });
          }

          const user = await userResponse.json() as UserInfo;

          // Return user info
          return Response.json({ user }, { status: 200, headers: CORS_JSON });
        } catch (error) {
          const err = error as Error;
          return Response.json(
              { error: 'Server error', message: err.message },
              { status: 500, headers: CORS_JSON }
          );
        }
      }

      // Return 404 for all other routes
      return new Response('Not found', {
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Content-Type': 'text/plain'
        }
      });

    } catch (error) {
      // Global error handler - avoid using process.env in Workers
      const err = error as Error;

      // Check if in development mode using env variable
      const isDevelopment = env.NODE_ENV !== 'production';

      return Response.json({
        error: 'Internal server error',
        message: err.message,
        // Only include stack trace in development mode
        stack: isDevelopment ? err.stack : undefined
      }, {
        status: 500,
        headers: CORS_JSON
      });
    }
  }
};