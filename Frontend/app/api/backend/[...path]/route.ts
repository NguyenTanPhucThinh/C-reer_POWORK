import { NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/server/auth-cookie';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const UPSTREAM_API_URL =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const upstreamUrl = new URL(`/api/v1/${path.join('/')}`, UPSTREAM_API_URL);
  upstreamUrl.search = request.nextUrl.search;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  headers.set('accept', request.headers.get('accept') || 'application/json');

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (token) headers.set('authorization', `Bearer ${token}`);

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return Response.json(
      {
        status: 'error',
        error_code: 'UPSTREAM_UNAVAILABLE',
        message: 'Backend API is unavailable.',
      },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();
  const upstreamContentType = upstreamResponse.headers.get('content-type');
  if (upstreamContentType) responseHeaders.set('content-type', upstreamContentType);

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
