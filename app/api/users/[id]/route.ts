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
  const { role } = await req.json();
  const { id } = await params;
  if (!role) return NextResponse.json({ error: 'role required' }, { status: 400 });
  const user = await prisma.user.update({ where: { id }, data: { role } as any });
  return NextResponse.json({ id: user.id, username: user.username, role: user.role });
}


