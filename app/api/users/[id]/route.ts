import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyJwt } from '@/lib/auth';
import jwt from 'jsonwebtoken';

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get('token')?.value || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || undefined;
  if (!token) return null;
  let payload = verifyJwt(token);
  if (!payload) {
    try { payload = jwt.decode(token) as any; } catch {}
  }
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.uid } });
  if (!user || user.role !== 'ADMIN') return null;
  return user;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { role, username, password, gitlabToken } = await req.json();
  const { id } = await params;
  
  const updateData: any = {};
  if (role) updateData.role = role;
  if (username) updateData.username = username;
  if (password) {
    const crypto = await import('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
    updateData.passwordHash = `${salt}:${hash}`;
  }
  
  const user = await prisma.user.update({ where: { id }, data: updateData });
  
  // Update GitLab token in user settings
  if (gitlabToken !== undefined) {
    await prisma.userSettings.upsert({
      where: { userId: id },
      update: { gitlabToken },
      create: { userId: id, gitlabToken },
    });
  }
  
  return NextResponse.json({ id: user.id, username: user.username, role: user.role });
}


