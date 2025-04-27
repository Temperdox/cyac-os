// worker/index.ts

// Cloudflare worker environment variables
interface Env {
  // each of these is a Secret-Store binding with a .get() that returns the real string
  DISCORD_CLIENT_ID: { get(): Promise<string> };
  DISCORD_CLIENT_SECRET: { get(): Promise<string> };
  DISCORD_REDIRECT_URI_CYAC_ME: { get(): Promise<string> };
  DISCORD_REDIRECT_URI_CYBERAC_ME: { get(): Promise<string> };
  DISCORD_REDIRECT_URI_OS_PROD: { get(): Promise<string> };
  JWT_SECRET: { get(): Promise<string> };
  SESSION_SECRET: { get(): Promise<string> };
  // any truly plain env var:
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
      function getRedirectUri(url: URL, originHeader: string | null): string {
        // If it got an Origin header (from the browser), trust it; otherwise fall back to the worker URL.
        const origin = originHeader && originHeader !== '*'
            ? new URL(originHeader).origin
            : url.origin;

        // Callback with origin to match given URI
        return `${origin}/discord-callback`;
      }

      // Token exchange endpoint
      if (url.pathname === '/auth/discord/token' && request.method === 'POST') {

        try {
          // Parse the request JSON
          const d_payload = await request.json() as { code: string; redirect_uri?: string };
          const code = d_payload.code;

          if (!code) {
            return Response.json(
                { error: 'Missing code parameter' },
                { status: 400, headers: CORS_JSON }
            );
          }

          // Get hostname from URL or Origin header for redirect URI
          const REDIRECT_URI = getRedirectUri(url, request.headers.get('Origin'));

          async function resolveSecret(x: string | { get(): Promise<string> }): Promise<string> {
            return typeof x === 'string' ? x : await x.get();
          }

          // Ensure that it has a string client ID
          const clientId     = await resolveSecret(env.DISCORD_CLIENT_ID);
          const clientSecret = await resolveSecret(env.DISCORD_CLIENT_SECRET);

          // Log the parameters for debugging
          console.log('Token exchange parameters:', {
            clientId,
            redirectUri: REDIRECT_URI,
            code: code.substring(0, 5) + '...' // Show only the beginning for security
          });

          const params = new URLSearchParams();
          params.append('client_id', clientId);
          params.append('client_secret', clientSecret);
          params.append('grant_type', 'authorization_code');
          params.append('code', code);
          params.append('redirect_uri', REDIRECT_URI);

          const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
          });

          if (!tokenRes.ok) {
            const errorText = await tokenRes.text();
            console.error('Token exchange failed:', tokenRes.status, errorText);

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
            console.error('Failed to fetch user info:', userRes.status);
            return Response.json({
              error: 'Failed to fetch user info',
              status: userRes.status
            }, { status: userRes.status, headers: CORS_JSON });
          }

          const userInfo = await userRes.json() as UserInfo;
          console.log('Successfully authenticated user:', userInfo.username);

          // Build JWT payload with 24h refresh and 14-day expiration
          const now = Math.floor(Date.now() / 1000);
          const jwt_payload = {
            discordId: userInfo.id,
            refreshAfter: now + 24 * 3600,              // 24 hours
            iat: now,                                   // issued at
            exp: now + 14 * 24 * 3600                   // 14 days
          };

          let jwtSecret: string;
          jwtSecret = await env.JWT_SECRET.get();

          // Sign JWT with secret
          const jwt = await signJwt(jwt_payload, jwtSecret);

          // Return tokens, JWT, and user info
          return Response.json({
            ...tokenData,
            jwt,
            user: userInfo
          }, { status: 200, headers: CORS_JSON });
        } catch (error) {
          const err = error as Error;
          console.error('Token exchange error:', err.message, err.stack);
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
            console.error('Failed to fetch user info from Discord:', userResponse.status);
            return Response.json({
              error: 'Failed to fetch user info',
              details: `Discord API returned ${userResponse.status}`
            }, { status: userResponse.status, headers: CORS_JSON });
          }

          const user = await userResponse.json() as UserInfo;
          console.log('Successfully retrieved user info for:', user.username);

          // Return user info
          return Response.json({ user }, { status: 200, headers: CORS_JSON });
        } catch (error) {
          const err = error as Error;
          console.error('Auth/me endpoint error:', err.message, err.stack);
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
      // Global error handler
      const err = error as Error;
      console.error('Global error handler:', err.message, err.stack);

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