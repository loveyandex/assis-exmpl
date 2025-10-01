import { NextRequest, NextResponse } from 'next/server';
import { listChats, prisma } from '@/lib/db';
import { verifyJwt } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyJwt(token) : null;
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const offset = (page - 1) * limit;
    const [chats, total] = await Promise.all([
      prisma.chat.findMany({
        where: { userId: payload.uid },
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { messages: true } } },
        take: limit,
        skip: offset,
      }),
      prisma.chat.count({ where: { userId: payload.uid } }),
    ]);
    
    return NextResponse.json({
      chats,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Failed to fetch chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}