"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/';

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ action: 'status', username: 'x', password: 'x' }) });
        const j = await res.json();
        setHasAdmin(!!j?.hasAdmin);
      } catch {
        setHasAdmin(true);
      }
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const action = hasAdmin ? 'login' : 'init-admin';
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, username, password }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error || 'Sign in failed');
      return;
    }
    // If we just initialized admin, immediately login using same credentials
    if (!hasAdmin) {
      await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', username, password }) });
    }
    // Use hard redirect to ensure middleware sees fresh auth cookie
    window.location.assign(next);
  };

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden>
        <svg className="absolute -left-10 top-0 h-[120%] w-[120%] text-purple-500/20" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="g" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx="200" cy="150" r="200" fill="url(#g)" />
          <circle cx="650" cy="450" r="250" fill="url(#g)" />
        </svg>
      </div>

      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center p-6">
        <div className="w-full rounded-2xl border bg-background/60 p-6 shadow-lg backdrop-blur">
          <div className="mb-4 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white">
              N
            </div>
            <h1 className="text-xl font-semibold">Sign in to Nemo</h1>
            <p className="text-muted-foreground text-sm">Nemo is AI Watch to projects of Xorg</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {error ? <div className="text-red-500 text-sm">{error}</div> : null}
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input className="w-full border rounded px-3 py-2" placeholder="admin" value={username} onChange={(e)=>setUsername(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input className="w-full border rounded px-3 py-2" type="password" placeholder={hasAdmin===false?"ADMIN_INIT_PASS":"Your password"} value={password} onChange={(e)=>setPassword(e.target.value)} />
            </div>
            <button className="w-full rounded bg-purple-600 text-white py-2 hover:bg-purple-700 transition">{hasAdmin===false?"Initialize Admin & Sign in":"Sign in"}</button>
          </form>
          <div className="mt-4 text-center text-xs text-muted-foreground">
            By continuing you agree to the Terms and Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
}


