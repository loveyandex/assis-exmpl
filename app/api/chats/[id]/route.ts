import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyJwt } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyJwt(token) : null;
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { title } = await request.json();
    const { id } = await params;
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required and must be a string' },
        { status: 400 }
      );
    }

    const updatedChat = await prisma.chat.update({
      where: { id, userId: payload.uid },
      data: { title: title.trim() },
    });

    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error('Failed to update chat:', error);
    return NextResponse.json(
      { error: 'Failed to update chat' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    const payload = token ? verifyJwt(token) : null;
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    
    await prisma.chat.delete({
      where: { id, userId: payload.uid },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete chat:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    );
  }
}

