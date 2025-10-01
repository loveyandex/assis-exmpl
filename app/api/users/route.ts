import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session || new Date(session.expiresAt) < new Date()) return null;
  if (session.user.role !== 'ADMIN') return null;
  return session.user;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(users.map(u => ({ id: u.id, username: u.username, role: u.role, createdAt: u.createdAt })));
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { username, password, role, gitlabToken } = await req.json();
  if (!username || !password) return NextResponse.json({ error: 'username/password required' }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return NextResponse.json({ error: 'Username exists' }, { status: 409 });
  const crypto = await import('crypto');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  const passwordHash = `${salt}:${hash}`;
  const user = await prisma.user.create({ data: { username, passwordHash, role: (role || 'PENDING') as any } });
  if (gitlabToken) {
    await prisma.userSettings.create({ data: { userId: user.id, gitlabToken } });
  }
  return NextResponse.json({ id: user.id, username: user.username, role: user.role });
}


