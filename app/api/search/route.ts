import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return Response.json({ results: [] });
  }

  try {
    // Search in chat titles
    const titleResults = await prisma.chat.findMany({
      where: {
        title: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      take: 10,
    });

    // Search in message content
    const messageResults = await prisma.message.findMany({
      where: {
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        chat: true,
      },
      take: 10,
    });

    // Combine and deduplicate results
    const allResults = [...titleResults, ...messageResults.map(m => m.chat)];
    const uniqueResults = allResults.filter((chat, index, self) => 
      index === self.findIndex(c => c.id === chat.id)
    );

    // Format results
    const results = uniqueResults.map(chat => ({
      id: chat.id,
      title: chat.title || 'Untitled Chat',
      excerpt: chat.messages?.[0]?.content?.slice(0, 100) + '...' || 'No messages',
      updatedAt: chat.updatedAt,
    }));

    return Response.json({ results });
  } catch (error) {
    console.error('Search failed:', error);
    return Response.json({ results: [] }, { status: 500 });
  }
}
