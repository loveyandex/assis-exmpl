import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import { signJwt } from '@/lib/auth';

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, passwordHash: string): boolean {
  const [salt, stored] = passwordHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(stored, 'hex'));
}

function makeSessionToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { action, username, password, role } = await req.json();
    if (!action || !username || !password) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (action === 'me') {
      const token = req.cookies.get('token')?.value;
      if (!token) return NextResponse.json({ user: null });
      const payload = verifyJwt(token);
      if (!payload) return NextResponse.json({ user: null });
      const user = await prisma.user.findUnique({ where: { id: payload.uid } });
      return NextResponse.json({ user: user ? { id: user.id, username: user.username, role: user.role } : null });
    }

    if (action === 'status') {
      const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' as any } });
      return NextResponse.json({ hasAdmin: !!existingAdmin });
    }

    if (action === 'init-admin') {
      const initPass = process.env.ADMIN_INIT_PASS;
      if (!initPass) return NextResponse.json({ error: 'ADMIN_INIT_PASS not set' }, { status: 400 });
      const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' as any } });
      if (existingAdmin) return NextResponse.json({ error: 'Admin already exists' }, { status: 400 });
      if (password !== initPass) return NextResponse.json({ error: 'Invalid admin init pass' }, { status: 401 });
      const admin = await prisma.user.create({ data: { username, passwordHash: await hashPassword(password), role: 'ADMIN' as any } });
      return NextResponse.json({ id: admin.id, username: admin.username, role: admin.role });
    }

    if (action === 'signup') {
      const exists = await prisma.user.findUnique({ where: { username } });
      if (exists) return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
      const user = await prisma.user.create({ data: { username, passwordHash: await hashPassword(password), role: (role || 'PENDING') as any } });
      return NextResponse.json({ id: user.id, username: user.username, role: user.role });
    }

    if (action === 'login') {
      let user = await prisma.user.findUnique({ where: { username } });
      if (!user) {
        // First-time convenience: if no admin exists and password matches ADMIN_INIT_PASS, create admin and login
        const hasAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' as any } });
        const initPass = process.env.ADMIN_INIT_PASS;
        if (!hasAdmin && initPass && password === initPass) {
          user = await prisma.user.create({ data: { username, passwordHash: await hashPassword(password), role: 'ADMIN' as any } });
        }
      }
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      const jwt = signJwt({ uid: user.id, role: user.role as any });
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
      const res = NextResponse.json({ id: user.id, username: user.username, role: user.role });
      res.cookies.set('token', jwt, { httpOnly: true, sameSite: 'lax', path: '/', expires: expiresAt });
      return res;
    }

    if (action === 'logout') {
      const res = NextResponse.json({ success: true });
      res.cookies.set('token', '', { httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(0) });
      return res;
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Auth error', err);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}


