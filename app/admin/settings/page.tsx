'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Settings,
  Key,
  Save,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle,
  Gamepad2,
  Plus,
  Trash2,
  Edit,
  DollarSign,
  Users,
  Mail,
  Server,
  Send,
} from 'lucide-react';

type GamePricing = {
  id: number;
  game_name: string;
  gender: string;
  price: number;
  players: number | null;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [smtpSaveSuccess, setSmtpSaveSuccess] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [settings, setSettings] = useState({
    openai_api_key: '',
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_email: '',
    smtp_password: '',
    smtp_from_name: 'FCIT Sports Society',
  });

  // Games state
  const [games, setGames] = useState<GamePricing[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [gameDialogOpen, setGameDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GamePricing | null>(null);
  const [savingGame, setSavingGame] = useState(false);
  const [gameForm, setGameForm] = useState({
    game_name: '',
    boys_price: '',
    boys_players: '',
    girls_price: '',
    girls_players: '',
  });

  useEffect(() => {
    loadSettings();
    loadGames();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setSettings({
          openai_api_key: data.data.openai_api_key || '',
          smtp_host: data.data.smtp_host || 'smtp.gmail.com',
          smtp_port: data.data.smtp_port || '587',
          smtp_email: data.data.smtp_email || '',
          smtp_password: data.data.smtp_password || '',
          smtp_from_name: data.data.smtp_from_name || 'FCIT Sports Society',
        });
      }
    } catch (error) {
      console.error('Load settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGames = async () => {
    setLoadingGames(true);
    try {
      const res = await fetch('/api/admin/games', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setGames(data.data);
      }
    } catch (error) {
      console.error('Load games error:', error);
    } finally {
      setLoadingGames(false);
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

  const handleSaveSmtp = async () => {
    setSavingSmtp(true);
    setSmtpSaveSuccess(false);
    try {
      // Save all SMTP settings
      const smtpSettings = [
        { key: 'smtp_host', value: settings.smtp_host },
        { key: 'smtp_port', value: settings.smtp_port },
        { key: 'smtp_email', value: settings.smtp_email },
        { key: 'smtp_password', value: settings.smtp_password },
        { key: 'smtp_from_name', value: settings.smtp_from_name },
      ];

      for (const setting of smtpSettings) {
        await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(setting),
        });
      }

      setSmtpSaveSuccess(true);
      setTimeout(() => setSmtpSaveSuccess(false), 3000);
    } catch (error) {
      alert('Failed to save SMTP settings');
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleTestEmail = async () => {
    if (!settings.smtp_email || !settings.smtp_password) {
      alert('Please configure SMTP email and password first');
      return;
    }

    setTestingEmail(true);
    try {
      const res = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: settings.smtp_email }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Test email sent successfully! Check your inbox.');
      } else {
        alert('Failed to send test email: ' + data.error);
      }
    } catch (error) {
      alert('Failed to send test email');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleOpenGameDialog = (game?: GamePricing) => {
    if (game) {
      // Find all entries for this game
      const gameName = game.game_name;
      const boysEntry = games.find(g => g.game_name === gameName && g.gender === 'boys');
      const girlsEntry = games.find(g => g.game_name === gameName && g.gender === 'girls');
      
      setEditingGame(game);
      setGameForm({
        game_name: gameName,
        boys_price: boysEntry?.price?.toString() || '',
        boys_players: boysEntry?.players?.toString() || '',
        girls_price: girlsEntry?.price?.toString() || '',
        girls_players: girlsEntry?.players?.toString() || '',
      });
    } else {
      setEditingGame(null);
      setGameForm({
        game_name: '',
        boys_price: '',
        boys_players: '',
        girls_price: '',
        girls_players: '',
      });
    }
    setGameDialogOpen(true);
  };

  const handleSaveGame = async () => {
    if (!gameForm.game_name.trim()) {
      alert('Game name is required');
      return;
    }

    setSavingGame(true);
    try {
      // Save boys pricing if provided
      if (gameForm.boys_price) {
        await fetch('/api/admin/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            game_name: gameForm.game_name.trim(),
            gender: 'boys',
            price: parseFloat(gameForm.boys_price),
            players: gameForm.boys_players ? parseInt(gameForm.boys_players) : null,
          }),
        });
      } else if (editingGame) {
        // Delete boys entry if price is removed
        await fetch(`/api/admin/games?game_name=${encodeURIComponent(gameForm.game_name)}&gender=boys`, {
          method: 'DELETE',
        });
      }

      // Save girls pricing if provided
      if (gameForm.girls_price) {
        await fetch('/api/admin/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            game_name: gameForm.game_name.trim(),
            gender: 'girls',
            price: parseFloat(gameForm.girls_price),
            players: gameForm.girls_players ? parseInt(gameForm.girls_players) : null,
          }),
        });
      } else if (editingGame) {
        // Delete girls entry if price is removed
        await fetch(`/api/admin/games?game_name=${encodeURIComponent(gameForm.game_name)}&gender=girls`, {
          method: 'DELETE',
        });
      }

      setGameDialogOpen(false);
      loadGames();
    } catch (error) {
      alert('Failed to save game');
    } finally {
      setSavingGame(false);
    }
  };

  const handleDeleteGame = async (gameName: string) => {
    if (!confirm(`Delete "${gameName}" (both male and female pricing)?`)) return;

    try {
      // Delete both genders
      await fetch(`/api/admin/games?game_name=${encodeURIComponent(gameName)}&gender=boys`, {
        method: 'DELETE',
      });
      await fetch(`/api/admin/games?game_name=${encodeURIComponent(gameName)}&gender=girls`, {
        method: 'DELETE',
      });
      loadGames();
    } catch (error) {
      alert('Failed to delete game');
    }
  };

  // Group games by name for display
  const groupedGames = games.reduce((acc, game) => {
    if (!acc[game.game_name]) {
      acc[game.game_name] = { boys: null, girls: null };
    }
    if (game.gender === 'boys') {
      acc[game.game_name].boys = game;
    } else {
      acc[game.game_name].girls = game;
    }
    return acc;
  }, {} as Record<string, { boys: GamePricing | null; girls: GamePricing | null }>);

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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* SMTP Email Settings */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration (SMTP)
            </CardTitle>
            <CardDescription className="text-blue-100">
              Configure email settings for sending notifications and announcements
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpEmail" className="text-sm font-medium">Email Address *</Label>
                  <Input
                    id="smtpEmail"
                    type="email"
                    value={settings.smtp_email}
                    onChange={(e) => setSettings({ ...settings, smtp_email: e.target.value })}
                    placeholder="sports@pucit.edu.pk"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPassword" className="text-sm font-medium">App Password *</Label>
                  <div className="relative">
                    <Input
                      id="smtpPassword"
                      type={showSmtpPassword ? 'text' : 'password'}
                      value={settings.smtp_password}
                      onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                      placeholder="16-character app password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Generate from{' '}
                    <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      Google App Passwords
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpFromName" className="text-sm font-medium">From Name</Label>
                  <Input
                    id="smtpFromName"
                    value={settings.smtp_from_name}
                    onChange={(e) => setSettings({ ...settings, smtp_from_name: e.target.value })}
                    placeholder="FCIT Sports Society"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost" className="text-sm font-medium">SMTP Server</Label>
                    <Input
                      id="smtpHost"
                      value={settings.smtp_host}
                      onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort" className="text-sm font-medium">Port</Label>
                    <Input
                      id="smtpPort"
                      value={settings.smtp_port}
                      onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-2">
                    <Server className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium">Gmail SMTP Settings:</p>
                      <ul className="text-xs text-blue-700 mt-1 space-y-1">
                        <li>• Server: <code className="bg-blue-100 px-1 rounded">smtp.gmail.com</code></li>
                        <li>• Port: <code className="bg-blue-100 px-1 rounded">587</code> (TLS)</li>
                        <li>• Enable 2-Step Verification on Google Account</li>
                        <li>• Use App Password, not your Gmail password</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSaveSmtp}
                    disabled={savingSmtp}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {savingSmtp ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : smtpSaveSuccess ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {smtpSaveSuccess ? 'Saved!' : 'Save SMTP'}
                  </Button>
                  <Button
                    onClick={handleTestEmail}
                    disabled={testingEmail || !settings.smtp_email}
                    variant="outline"
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    {testingEmail ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Test Email
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Key Settings */}
        <Card className="border-0 shadow-lg">
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

        {/* Games & Pricing Management */}
        <Card className="border-0 shadow-lg lg:col-span-1">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5" />
                  Games & Pricing
                </CardTitle>
                <CardDescription className="text-emerald-100">
                  Manage games, prices, and team sizes
                </CardDescription>
              </div>
              <Button
                onClick={() => handleOpenGameDialog()}
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Game
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {loadingGames ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            ) : Object.keys(groupedGames).length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Gamepad2 className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                <p>No games configured</p>
                <p className="text-sm">Click "Add Game" to get started</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {Object.entries(groupedGames).map(([name, { boys, girls }]) => (
                  <div key={name} className="border rounded-lg p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 truncate">{name}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {boys && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              ♂ Rs.{boys.price}
                              {boys.players && boys.players > 1 && (
                                <span className="text-blue-500">({boys.players}p)</span>
                              )}
                            </span>
                          )}
                          {girls && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-pink-100 text-pink-700 rounded">
                              ♀ Rs.{girls.price}
                              {girls.players && girls.players > 1 && (
                                <span className="text-pink-500">({girls.players}p)</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenGameDialog(boys || girls!)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4 text-slate-400" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteGame(name)}
                          className="h-8 w-8 p-0 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Game Add/Edit Dialog */}
      <Dialog open={gameDialogOpen} onOpenChange={setGameDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-emerald-600" />
              {editingGame ? 'Edit Game' : 'Add New Game'}
            </DialogTitle>
            <DialogDescription>
              {editingGame ? 'Update game pricing and settings' : 'Add a new game with pricing'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Game Name *</Label>
              <Input
                value={gameForm.game_name}
                onChange={(e) => setGameForm({ ...gameForm, game_name: e.target.value })}
                placeholder="e.g., Cricket, Football, Chess"
                disabled={!!editingGame}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Male Pricing */}
              <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 flex items-center gap-1">
                  <span className="text-lg">♂</span> Male
                </h4>
                <div className="space-y-2">
                  <Label className="text-sm text-blue-700">Price (Rs.)</Label>
                  <Input
                    type="number"
                    value={gameForm.boys_price}
                    onChange={(e) => setGameForm({ ...gameForm, boys_price: e.target.value })}
                    placeholder="e.g., 200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-blue-700">Team Size</Label>
                  <Input
                    type="number"
                    value={gameForm.boys_players}
                    onChange={(e) => setGameForm({ ...gameForm, boys_players: e.target.value })}
                    placeholder="1 for singles"
                  />
                </div>
              </div>

              {/* Female Pricing */}
              <div className="space-y-3 p-3 bg-pink-50 rounded-lg">
                <h4 className="font-medium text-pink-800 flex items-center gap-1">
                  <span className="text-lg">♀</span> Female
                </h4>
                <div className="space-y-2">
                  <Label className="text-sm text-pink-700">Price (Rs.)</Label>
                  <Input
                    type="number"
                    value={gameForm.girls_price}
                    onChange={(e) => setGameForm({ ...gameForm, girls_price: e.target.value })}
                    placeholder="e.g., 200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-pink-700">Team Size</Label>
                  <Input
                    type="number"
                    value={gameForm.girls_players}
                    onChange={(e) => setGameForm({ ...gameForm, girls_players: e.target.value })}
                    placeholder="1 for singles"
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Leave price empty to disable the game for that gender. Team size of 1 means individual game.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setGameDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveGame}
                disabled={savingGame || !gameForm.game_name.trim()}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {savingGame ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Game
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
