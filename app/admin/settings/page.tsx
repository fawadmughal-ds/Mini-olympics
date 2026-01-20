'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  Key,
  Save,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settings, setSettings] = useState({
    openai_api_key: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setSettings({
          openai_api_key: data.data.openai_api_key || '',
        });
      }
    } catch (error) {
      console.error('Load settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'openai_api_key', value: settings.openai_api_key }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save: ' + data.error);
      }
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
            <Settings className="h-5 w-5 text-white" />
          </div>
          Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">Configure system settings (Super Admin only)</p>
      </div>

      {/* API Key Settings */}
      <Card className="border-0 shadow-lg max-w-2xl">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            AI API Configuration
          </CardTitle>
          <CardDescription className="text-purple-100">
            Configure OpenAI API key for AI-powered match generation
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-sm font-medium">OpenAI API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.openai_api_key}
                  onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Get your API key from{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-purple-600 hover:underline">
                OpenAI Dashboard
              </a>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSaveApiKey}
              disabled={saving}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saveSuccess ? 'Saved!' : 'Save API Key'}
            </Button>
            
            {settings.openai_api_key && (
              <span className="flex items-center gap-1 text-sm text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                API key configured
              </span>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-medium">Important Notes:</p>
                <ul className="text-xs text-amber-700 mt-1 list-disc list-inside space-y-1">
                  <li>The API key is stored securely in the database</li>
                  <li>OpenAI charges for API usage - monitor your usage</li>
                  <li>Use GPT-3.5-turbo for cost-effective match generation</li>
                  <li>Only Super Admins can view and modify this setting</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
