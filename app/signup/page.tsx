"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signup', username, password }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error || 'Signup failed');
      return;
    }
    router.push('/login');
  };

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Create account</h1>
        {error ? <div className="text-red-500 text-sm">{error}</div> : null}
        <input className="w-full border rounded px-3 py-2" placeholder="Username" value={username} onChange={(e)=>setUsername(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button className="w-full rounded bg-black text-white py-2">Sign up</button>
        <a className="block text-sm text-blue-600" href="/login">Have an account? Sign in</a>
      </form>
    </div>
  );
}


