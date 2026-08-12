export type UserRole = 'Candidate' | 'Employer';

export interface User {
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  company_id?: string | null;
  avatar_url?: string;
  created_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  role?: UserRole;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  company_name?: string;
  accepted_terms: boolean;
}

export interface AuthSession {
  access_token: string;
  token_type: 'Bearer';
  user: User;
}

/**
 * Phản hồi mà BFF (app/api/auth/*) trả về cho client. Access token KHÔNG nằm
 * trong body — nó được set dưới dạng cookie httpOnly. Client chỉ nhận user.
 */
export interface AuthResponse {
  user: User;
}
