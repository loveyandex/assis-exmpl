"use client";
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function LdapLoginForm() {
  const [userlogon, setUserlogon] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ action: 'ldap-login', username: userlogon, password }) });
    if (!res.ok) {
      const j = await res.json().catch(()=>({}));
      setError(j?.error || 'LDAP login failed');
      return;
    }
    window.location.assign(next);
  };

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center p-6">
        <div className="w-full rounded-2xl border bg-background/60 p-6 shadow-lg backdrop-blur">
          <div className="mb-4 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white">N</div>
            <h1 className="text-xl font-semibold">Sign in with LDAP</h1>
            <p className="text-muted-foreground text-sm">Use your corporate credentials</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {error ? <div className="text-red-500 text-sm">{error}</div> : null}
            <div>
              <label className="block text-sm font-medium mb-1">User Logon</label>
              <input className="w-full border rounded px-3 py-2" placeholder="jdoe" value={userlogon} onChange={(e)=>setUserlogon(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input className="w-full border rounded px-3 py-2" type="password" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} />
            </div>
            <button className="w-full rounded bg-purple-600 text-white py-2 hover:bg-purple-700 transition">Sign in</button>
          </form>
          <div className="mt-4 text-center text-xs text-muted-foreground">
            <a className="text-blue-600" href="/login">Back to password login</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LdapLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LdapLoginForm />
    </Suspense>
  );
}


