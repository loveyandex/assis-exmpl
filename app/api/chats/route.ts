import { listChats } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    const chats = await listChats(limit, offset);
    return Response.json({ 
      chats: chats.chats,
      pagination: {
        page,
        limit,
        total: chats.total,
        hasMore: offset + limit < chats.total
      }
    });
  } catch (error) {
    console.error('Failed to list chats:', error);
    return Response.json({ chats: [] }, { status: 500 });
  }
}
