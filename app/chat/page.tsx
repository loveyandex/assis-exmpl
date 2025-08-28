import { redirect } from 'next/navigation';
import { createChat } from '@/lib/db';

export default async function ChatPage() {
  const id = await createChat();
  redirect(`/chat/${id}`);
}
