"use client";

import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UserSettings {
  openaiBaseUrl: string;
  openaiApiKey: string;
  modelName: string;
  gitlabUrl: string;
  gitlabToken: string;
}

export function SettingsModal() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    openaiBaseUrl: '',
    openaiApiKey: '',
    modelName: '',
    gitlabUrl: '',
    gitlabToken: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          openaiBaseUrl: data.openaiBaseUrl || process.env.NEXT_PUBLIC_OPENAI_BASE_URL || 'https://api.openai.com/v1',
          openaiApiKey: data.openaiApiKey || '',
          modelName: data.modelName || process.env.NEXT_PUBLIC_MODEL_NAME || 'gpt-oss-120b',
          gitlabUrl: data.gitlabUrl || process.env.NEXT_PUBLIC_GITLAB_URL || 'https://git.lab/api/v4',
          gitlabToken: data.gitlabToken || '',
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        setOpen(false);
      } else {
        console.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configs">API Config</TabsTrigger>
            <TabsTrigger value="gitlab">GitLab Config</TabsTrigger>
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
                    value={settings.openaiBaseUrl}
                    onChange={(e) => handleInputChange('openaiBaseUrl', e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="openai-api-key">OpenAI API Key</Label>
                  <Input
                    id="openai-api-key"
                    type="password"
                    value={settings.openaiApiKey}
                    onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                    placeholder="sk-..."
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="model-name">Model Name</Label>
                  <Input
                    id="model-name"
                    value={settings.modelName}
                    onChange={(e) => handleInputChange('modelName', e.target.value)}
                    placeholder="gpt-oss-120b"
                    disabled={loading}
                  />
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
                    value={settings.gitlabUrl}
                    onChange={(e) => handleInputChange('gitlabUrl', e.target.value)}
                    placeholder="https://git.lab/api/v4"
                    disabled={loading}
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

