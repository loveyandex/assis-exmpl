"use client";
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginLayout from '@/components/login-layout';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
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
    <LoginLayout 
      title="Sign in to Nemo" 
      subtitle="Nemo is AI Chat to project managment of organization"
    >
      <form onSubmit={submit} className="space-y-6">
        {error ? <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">{error}</div> : null}
        <div>
          <label className="block text-sm font-medium mb-2">Username</label>
          <input 
            className="w-full border border-input rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent" 
            placeholder="admin" 
            value={username} 
            onChange={(e)=>setUsername(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input 
            className="w-full border border-input rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent" 
            type="password" 
            placeholder={hasAdmin===false?"ADMIN_INIT_PASS":"Your password"} 
            value={password} 
            onChange={(e)=>setPassword(e.target.value)} 
          />
        </div>
        <button className="w-full rounded-md bg-primary text-primary-foreground py-2 hover:bg-primary/90 transition-colors font-medium">
          {hasAdmin===false?"Initialize Admin & Sign in":"Sign in"}
        </button>
      </form>
      <div className="mt-6 text-center text-xs text-muted-foreground">
        By continuing you agree to the Terms and Privacy Policy.
      </div>
      <div className="mt-2 text-center text-xs text-muted-foreground">
        <a className="text-primary hover:text-primary/80 transition-colors" href="/login/ldap">Sign in with LDAP</a>
      </div>
    </LoginLayout>
  );
}


