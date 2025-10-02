"use client";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ username: '', password: '', gitlabToken: '' });
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', password: '', gitlabToken: '' });

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
    // toast.success('Users loaded');
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

  function openEditModal(user: any) {
    setEditingUser(user);
    setEditForm({ username: user.username, password: '', gitlabToken: user.gitlabToken || '' });
    setEditModalOpen(true);
  }

  async function saveUserEdit() {
    if (!editingUser) return;
    const res = await fetch(`/api/users/${editingUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username: editForm.username,
        password: editForm.password || undefined,
        gitlabToken: editForm.gitlabToken,
      }),
    });
    if (res.ok) {
      toast.success('User updated');
      setEditModalOpen(false);
      load();
    } else {
      const j = await res.json().catch(() => ({}));
      toast.error(j?.error || 'Failed to update user');
    }
  }

  function roleButtonClass(role: string): string {
    if (role === 'ADMIN') return 'border-purple-500 text-purple-600';
    if (role === 'USER') return 'border-green-500 text-green-600';
    return 'border-amber-500 text-amber-600';
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Manage Users</h1>
          <p className="text-sm text-muted-foreground">Admin can add users and toggle roles.</p>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {error ? <div className="text-red-500 text-sm">{error}</div> : null}

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Create new users</div>
          <Button onClick={() => setCreateOpen(true)}>Add user</Button>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(u)}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={editForm.username}
                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-gitlab-token">GitLab Token</Label>
              <Input
                id="edit-gitlab-token"
                type="password"
                value={editForm.gitlabToken}
                onChange={(e) => setEditForm(prev => ({ ...prev, gitlabToken: e.target.value }))}
                placeholder="glpat-..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveUserEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-username">Username</Label>
              <Input
                id="create-username"
                value={createForm.username}
                onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="jane.doe"
              />
            </div>
            <div>
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="temporary password"
              />
            </div>
            <div>
              <Label htmlFor="create-gitlab-token">GitLab Token (optional)</Label>
              <Input
                id="create-gitlab-token"
                type="password"
                value={createForm.gitlabToken}
                onChange={(e) => setCreateForm(prev => ({ ...prev, gitlabToken: e.target.value }))}
                placeholder="glpat-..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!createForm.username || !createForm.password) {
                  toast.error('Username and password are required');
                  return;
                }
                const res = await fetch('/api/users', {
                  method: 'POST',
                  headers: { 'Content-Type':'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ username: createForm.username, password: createForm.password, role: 'USER', gitlabToken: createForm.gitlabToken || undefined })
                });
                if (!res.ok) {
                  const j = await res.json().catch(() => ({}));
                  toast.error(j?.error || 'Failed to create user');
                  return;
                }
                toast.success('User created');
                setCreateOpen(false);
                setCreateForm({ username: '', password: '', gitlabToken: '' });
                load();
              }}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


