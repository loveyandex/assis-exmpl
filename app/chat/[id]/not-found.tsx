import Link from 'next/link';

export default function ChatNotFound() {
  return (
    <div className="flex h-dvh w-full items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold">This chat could not be found</h1>
        <p className="text-muted-foreground">It may have been deleted. Start a new one instead.</p>
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
        >
          Go to new chat
        </Link>
      </div>
    </div>
  );
}


