import { PrismaClient } from '@prisma/client';
import { UIMessage } from 'ai';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Chat operations
export async function createChat(): Promise<string> {
  const chat = await prisma.chat.create({
    data: {
      title: 'New Chat',
    },
  });
  return chat.id;
}

export async function loadChat(id: string): Promise<UIMessage[]> {
  const chat = await prisma.chat.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!chat) {
    throw new Error('Chat not found');
  }

  return chat.messages.map((message: any) => ({
    id: message.id,
    role: message.role as 'user' | 'assistant',
    content: message.content,
    toolCalls: message.toolCalls ? JSON.parse(message.toolCalls) : undefined,
    metadata: message.metadata ? JSON.parse(message.metadata) : undefined,
  })) as UIMessage[];
}

export async function saveChat(chatId: string, messages: UIMessage[]): Promise<void> {
  // Update chat title based on first user message
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (firstUserMessage && 'content' in firstUserMessage) {
    const content = firstUserMessage.content as string;
    const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    await prisma.chat.update({
      where: { id: chatId },
      data: { title },
    });
  }

  // Save all messages
  for (const message of messages) {
    await prisma.message.upsert({
      where: { id: message.id },
      update: {
        content: 'content' in message ? (message.content as string) : '',
        toolCalls: 'toolCalls' in message && message.toolCalls ? JSON.stringify(message.toolCalls) : null,
        metadata: 'metadata' in message && message.metadata ? JSON.stringify(message.metadata) : null,
      },
      create: {
        id: message.id,
        role: message.role,
        content: 'content' in message ? (message.content as string) : '',
        chatId,
        toolCalls: 'toolCalls' in message && message.toolCalls ? JSON.stringify(message.toolCalls) : null,
        metadata: 'metadata' in message && message.metadata ? JSON.stringify(message.metadata) : null,
      },
    });
  }
}

export async function listChats(limit: number = 20, offset: number = 0) {
  const [chats, total] = await Promise.all([
    prisma.chat.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
      take: limit,
      skip: offset,
    }),
    prisma.chat.count(),
  ]);

  return { chats, total };
}

export async function deleteChat(id: string): Promise<void> {
  await prisma.chat.delete({
    where: { id },
  });
}
