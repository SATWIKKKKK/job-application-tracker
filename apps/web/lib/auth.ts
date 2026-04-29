import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

export function getToken() {
  return cookies().get('jt_token')?.value;
}

export function getSessionUser(): SessionUser | null {
  const token = getToken();
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET ?? 'dev-secret-change-me') as SessionUser;
  } catch {
    return null;
  }
}
