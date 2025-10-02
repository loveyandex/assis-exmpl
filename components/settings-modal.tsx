"use client";

import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface UserSettings {
  gitlabToken: string;
}

interface SystemSettings {
  openaiBaseUrl: string;
  openaiApiKey: string;
  modelName: string;
  gitlabUrl: string;
}

export function SettingsModal() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    gitlabToken: '',
  });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    openaiBaseUrl: '',
    openaiApiKey: '',
    modelName: '',
    gitlabUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<'ADMIN'|'USER'|'PENDING'|'GUEST'>('GUEST');
  // LDAP minimal config state (admin-only)
  const [ldap, setLdap] = useState({
    host: '',
    port: 389,
    bindDn: '',
    bindPassword: '',
    base: '',
    uid: 'sAMAccountName',
    encryption: 'plain',
  });

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // fetch role
      try {
        const meRes = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ action: 'me', username: 'x', password: 'x' }) });
        const me = await meRes.json();
        setRole(me?.user?.role || 'GUEST');
      } catch {}

      // Load user settings (only GitLab token)
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          gitlabToken: data.gitlabToken || '',
        });
      }

      // Load system settings (global config)
      const sysResponse = await fetch('/api/system-settings');
      if (sysResponse.ok) {
        const sysData = await sysResponse.json();
        setSystemSettings({
          openaiBaseUrl: sysData.openaiBaseUrl || 'https://api.openai.com/v1',
          openaiApiKey: sysData.openaiApiKey || '',
          modelName: sysData.modelName || 'gpt-oss-120b',
          gitlabUrl: sysData.gitlabUrl || 'https://git.lab/api/v4',
        });
      }

      // Load system LDAP settings
      try {
        const sysRes = await fetch('/api/system-settings');
        if (sysRes.ok) {
          const s = await sysRes.json();
          const L = s?.ldap || {};
          setLdap({
            host: L.host || '',
            port: Number(L.port ?? 389),
            bindDn: L.bindDn || '',
            bindPassword: '',
            base: L.baseDn || L.base || '',
            uid: L.uidAttr || 'sAMAccountName',
            encryption: L.encryption || 'plain',
          });
        }
      } catch {}
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save user settings (GitLab token)
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        console.error('Failed to save user settings');
        toast.error('Failed to save user settings');
        return;
      }

      // Save system settings (admin only)
      if (role === 'ADMIN') {
        const sysRes = await fetch('/api/system-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            openaiBaseUrl: systemSettings.openaiBaseUrl,
            openaiApiKey: systemSettings.openaiApiKey,
            modelName: systemSettings.modelName,
            gitlabUrl: systemSettings.gitlabUrl,
            ldap: {
              host: ldap.host,
              port: Number(ldap.port) || 389,
              bindDn: ldap.bindDn,
              bindPassword: ldap.bindPassword || undefined,
              baseDn: ldap.base,
              uidAttr: ldap.uid,
              encryption: ldap.encryption,
            }
          }),
        });
        if (!sysRes.ok) {
          toast.error('Failed to save system settings');
          return;
        }
      }

      setOpen(false);
      toast.success('Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSystemInputChange = (field: keyof SystemSettings, value: string) => {
    setSystemSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="configs" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="configs" disabled={role !== 'ADMIN'}>API Config</TabsTrigger>
            <TabsTrigger value="gitlab">GitLab Config</TabsTrigger>
            <TabsTrigger value="ldap" disabled={role !== 'ADMIN'}>LDAP</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="configs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>
                  Configure your OpenAI API settings for the chat interface.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openai-base-url">OpenAI Base URL</Label>
                  <Input
                    id="openai-base-url"
                    value={systemSettings.openaiBaseUrl}
                    onChange={(e) => handleSystemInputChange('openaiBaseUrl', e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    disabled={loading || role !== 'ADMIN'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="openai-api-key">OpenAI API Key</Label>
                  <Input
                    id="openai-api-key"
                    type="password"
                    value={systemSettings.openaiApiKey}
                    onChange={(e) => handleSystemInputChange('openaiApiKey', e.target.value)}
                    placeholder="sk-..."
                    disabled={loading || role !== 'ADMIN'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="model-name">Model Name</Label>
                  <Input
                    id="model-name"
                    value={systemSettings.modelName}
                    onChange={(e) => handleSystemInputChange('modelName', e.target.value)}
                    placeholder="gpt-oss-120b"
                    disabled={loading || role !== 'ADMIN'}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ldap" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>LDAP Configuration</CardTitle>
                <CardDescription>System-wide LDAP settings for corporate sign-in.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="ldap-host">Host</Label>
                    <Input id="ldap-host" placeholder="ldap.example.com" disabled={role !== 'ADMIN'} value={ldap.host} onChange={(e)=>setLdap(prev=>({...prev, host: e.target.value}))} />
                  </div>
                  <div>
                    <Label htmlFor="ldap-port">Port</Label>
                    <Input id="ldap-port" placeholder="389" disabled={role !== 'ADMIN'} value={ldap.port} onChange={(e)=>setLdap(prev=>({...prev, port: Number(e.target.value||'0')}))} />
                  </div>
                  <div>
                    <Label htmlFor="ldap-uid">UID Attribute</Label>
                    <Input id="ldap-uid" placeholder="sAMAccountName" disabled={role !== 'ADMIN'} value={ldap.uid} onChange={(e)=>setLdap(prev=>({...prev, uid: e.target.value}))} />
                  </div>
                  <div>
                    <Label htmlFor="ldap-encryption">Encryption</Label>
                    <Input id="ldap-encryption" placeholder="plain" disabled={role !== 'ADMIN'} value={ldap.encryption} onChange={(e)=>setLdap(prev=>({...prev, encryption: e.target.value}))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ldap-binddn">Bind DN</Label>
                  <Input id="ldap-binddn" placeholder="CN=Bind,OU=Users,DC=example,DC=com" disabled={role !== 'ADMIN'} value={ldap.bindDn} onChange={(e)=>setLdap(prev=>({...prev, bindDn: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ldap-bindpass">Bind Password</Label>
                  <Input id="ldap-bindpass" type="password" placeholder="••••••••" disabled={role !== 'ADMIN'} value={ldap.bindPassword} onChange={(e)=>setLdap(prev=>({...prev, bindPassword: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ldap-base">Base DN</Label>
                  <Input id="ldap-base" placeholder="OU=Users,DC=example,DC=com" disabled={role !== 'ADMIN'} value={ldap.base} onChange={(e)=>setLdap(prev=>({...prev, base: e.target.value}))} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="gitlab" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>GitLab Configuration</CardTitle>
                <CardDescription>
                  Configure your GitLab instance settings for project management.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gitlab-url">GitLab URL</Label>
                  <Input
                    id="gitlab-url"
                    value={systemSettings.gitlabUrl}
                    onChange={(e) => handleSystemInputChange('gitlabUrl', e.target.value)}
                    placeholder="https://git.lab/api/v4"
                    disabled={loading || role !== 'ADMIN'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gitlab-token">GitLab Token</Label>
                  <Input
                    id="gitlab-token"
                    type="password"
                    value={settings.gitlabToken}
                    onChange={(e) => handleInputChange('gitlabToken', e.target.value)}
                    placeholder="glpat-..."
                    disabled={loading}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the appearance of your chat interface.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Appearance settings will be available in future updates.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

