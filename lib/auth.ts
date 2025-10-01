import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const TOKEN_COOKIE = 'token';

export type JwtPayload = {
  uid: string;
  role: 'ADMIN' | 'USER' | 'PENDING';
};

export function signJwt(payload: JwtPayload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const secret = process.env.JWT_SECRET as string;
    return jwt.verify(token, secret) as JwtPayload;
  } catch {
    return null;
  }
}

export async function getAuthTokenFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE)?.value;
    return token ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const token = await getAuthTokenFromCookies();
  if (!token) return null;
  const payload = verifyJwt(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.uid } });
  if (!user) return null;
  return user;
}

export function setAuthCookie(res: Response, token: string): void {}


