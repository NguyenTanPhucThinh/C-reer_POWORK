import { NextRequest, NextResponse } from 'next/server';

const ACCESS_TOKEN_COOKIE = 'access_token';

/** Route cần đăng nhập mới được vào. */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/candidate',
  '/employer',
  '/challenges',
  '/talent-pool',
  '/profile',
  '/submissions',
];

/**
 * Proxy (tên mới của middleware từ Next 16): chạy server-side, đọc cookie
 * httpOnly access_token để chặn/redirect trước khi render trang.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasToken = Boolean(req.cookies.get(ACCESS_TOKEN_COOKIE)?.value);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Chưa đăng nhập mà vào trang cần bảo vệ -> đẩy về /login (kèm ?redirect).
  if (isProtected && !hasToken) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Bỏ qua static assets, api routes, file tĩnh; chỉ chạy trên route trang.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
