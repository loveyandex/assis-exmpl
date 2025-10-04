"use client";
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginLayout from '@/components/login-layout';

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
    <LoginLayout 
      title="Sign in with LDAP" 
      subtitle="Use your corporate credentials"
    >
      <form onSubmit={submit} className="space-y-6">
        {error ? <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">{error}</div> : null}
        <div>
          <label className="block text-sm font-medium mb-2">User Logon</label>
          <input 
            className="w-full border border-input rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent" 
            placeholder="jdoe" 
            value={userlogon} 
            onChange={(e)=>setUserlogon(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input 
            className="w-full border border-input rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent" 
            type="password" 
            placeholder="••••••••" 
            value={password} 
            onChange={(e)=>setPassword(e.target.value)} 
          />
        </div>
        <button className="w-full rounded-md bg-primary text-primary-foreground py-2 hover:bg-primary/90 transition-colors font-medium">
          Sign in
        </button>
      </form>
      <div className="mt-6 text-center text-xs text-muted-foreground">
        <a className="text-primary hover:text-primary/80 transition-colors" href="/login">Back to password login</a>
      </div>
    </LoginLayout>
  );
}

export default function LdapLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LdapLoginForm />
    </Suspense>
  );
}


