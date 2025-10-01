import { redirect } from 'next/navigation';
import { createChat } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Ensure production uses a fresh render each request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/`);
  }
  const id = await createChat(user.id);
  redirect(`/chat/${id}`);
}
