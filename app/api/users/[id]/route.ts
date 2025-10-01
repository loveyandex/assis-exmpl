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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { role } = await req.json();
  const { id } = await params;
  if (!role) return NextResponse.json({ error: 'role required' }, { status: 400 });
  const user = await prisma.user.update({ where: { id }, data: { role } as any });
  return NextResponse.json({ id: user.id, username: user.username, role: user.role });
}


