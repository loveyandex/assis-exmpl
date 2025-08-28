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

  return chat.messages.map((message) => ({
    id: message.id,
    role: message.role as 'user' | 'assistant',
    content: message.content,
    toolCalls: message.toolCalls as any,
    metadata: message.metadata as any,
  })) as UIMessage[];
}

export async function saveChat(chatId: string, messages: UIMessage[]): Promise<void> {
  // Update chat title based on first user message
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (firstUserMessage) {
    const title = firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
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
        content: message.content,
        toolCalls: message.toolCalls,
        metadata: message.metadata,
      },
      create: {
        id: message.id,
        role: message.role,
        content: message.content,
        chatId,
        toolCalls: message.toolCalls,
        metadata: message.metadata,
      },
    });
  }
}

export async function listChats() {
  return await prisma.chat.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });
}

export async function deleteChat(id: string): Promise<void> {
  await prisma.chat.delete({
    where: { id },
  });
}
