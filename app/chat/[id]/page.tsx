import { loadChat } from '@/lib/db';
import { Assistant } from '@/app/assistant';
import { notFound } from 'next/navigation';

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const messages = await loadChat(id);
    return <Assistant chatId={id} initialMessages={messages} />;
  } catch (error) {
    notFound();
  }
}
