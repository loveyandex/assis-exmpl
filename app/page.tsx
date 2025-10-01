import { redirect } from 'next/navigation';
import { createChat } from '@/lib/db';

// Ensure production uses a fresh render each request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const id = await createChat();
  redirect(`/chat/${id}`);
}
