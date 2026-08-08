import type {
  ApiErrorBody,
  ApiSuccess,
  AuthSession,
  LoginRequest,
  RegisterRequest,
  User,
} from '@/lib/types';

const UPSTREAM_API_URL =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface UpstreamSession {
  token: string;
  user: User;
}

export class AuthError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

async function requestUpstream<T>(
  path: string,
  init: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('accept', 'application/json');
  if (init.body) headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(new URL(path, UPSTREAM_API_URL), {
      ...init,
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new AuthError(502, 'UPSTREAM_UNAVAILABLE', 'Backend đăng nhập không khả dụng.');
  }

  let body: ApiSuccess<T> | ApiErrorBody;
  try {
    body = (await response.json()) as ApiSuccess<T> | ApiErrorBody;
  } catch {
    throw new AuthError(502, 'UPSTREAM_INVALID_RESPONSE', 'Backend trả về dữ liệu không hợp lệ.');
  }

  if (!response.ok || body.status === 'error') {
    const error = body as ApiErrorBody;
    throw new AuthError(
      response.status,
      error.error_code || 'AUTH_ERROR',
      error.message || 'Không thể xác thực người dùng.'
    );
  }

  return body.data;
}

const toUpstreamSession = (session: AuthSession): UpstreamSession => ({
  token: session.access_token,
  user: session.user,
});

export async function loginUpstream(payload: LoginRequest): Promise<UpstreamSession> {
  const session = await requestUpstream<AuthSession>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: payload.email, password: payload.password }),
  });
  return toUpstreamSession(session);
}

export async function registerUpstream(payload: RegisterRequest): Promise<UpstreamSession> {
  const session = await requestUpstream<AuthSession>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return toUpstreamSession(session);
}

export async function meUpstream(token: string): Promise<User> {
  return requestUpstream<User>('/api/v1/auth/me', {}, token);
}

export async function exchangeGoogleCode(code: string): Promise<UpstreamSession> {
  const session = await requestUpstream<AuthSession>('/api/v1/auth/google/exchange', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  return toUpstreamSession(session);
}
