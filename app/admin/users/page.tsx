"use client";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    const res = await fetch('/api/users', { credentials: 'include' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error || 'Failed to load users');
      toast.error(j?.error || 'Failed to load users');
      return;
    }
    const data = await res.json();
    setUsers(data);
    toast.success('Users loaded');
  }

  useEffect(() => { load(); }, []);

  async function toggleRole(id: string, role: string) {
    const roles = ['PENDING','USER','ADMIN'];
    const next = roles[(roles.indexOf(role) + 1) % roles.length];
    const res = await fetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ role: next }), credentials: 'include' });
    if (res.ok) {
      toast.success('Role updated');
      load();
    } else {
      const j = await res.json().catch(() => ({}));
      toast.error(j?.error || 'Failed to update role');
    }
  }

  function roleButtonClass(role: string): string {
    if (role === 'ADMIN') return 'border-purple-500 text-purple-600';
    if (role === 'USER') return 'border-green-500 text-green-600';
    return 'border-amber-500 text-amber-600';
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Manage Users</h1>
        <p className="text-sm text-muted-foreground">Admin can add users and toggle roles.</p>
      </div>

      {error ? <div className="text-red-500 text-sm">{error}</div> : null}

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="New username" id="new-username" />
            <Input type="password" placeholder="Temp password" id="new-password" />
          </div>
          <Button
            onClick={async () => {
              const username = (document.getElementById('new-username') as HTMLInputElement)?.value?.trim();
              const password = (document.getElementById('new-password') as HTMLInputElement)?.value;
              if (!username || !password) return;
              const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type':'application/json' }, credentials: 'include', body: JSON.stringify({ username, password, role: 'USER' }) });
              if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                setError(j?.error || 'Failed to create user');
                toast.error(j?.error || 'Failed to create user');
                return;
              }
              toast.success('User created');
              (document.getElementById('new-username') as HTMLInputElement).value = '';
              (document.getElementById('new-password') as HTMLInputElement).value = '';
              load();
            }}
          >Add user</Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="divide-y">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  {u.username.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{u.username}</div>
                  <div className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className={`text-xs px-3 py-1 ${roleButtonClass(u.role)}`}
                  onClick={()=>toggleRole(u.id, u.role)}
                >
                  {u.role}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}


