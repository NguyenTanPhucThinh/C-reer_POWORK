import { clearAuthCookie } from '@/lib/server/auth-cookie';
import { jsonSuccess } from '@/lib/server/api-response';

export async function POST() {
  const res = jsonSuccess<{ message: string }>({ message: 'Đã đăng xuất' });
  clearAuthCookie(res);
  return res;
}
