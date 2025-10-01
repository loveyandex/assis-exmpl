import { loadChat } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Assistant } from '@/app/assistant';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  
  try {
    const messages = await loadChat(id, user?.id);
    return <Assistant key={id} chatId={id} initialMessages={messages} />;
  } catch (error) {
    console.error(error)
    notFound();
  }
}
