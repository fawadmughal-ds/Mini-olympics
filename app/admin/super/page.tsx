'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Link2,
  Phone,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  User,
  UserCircle2,
} from 'lucide-react';

type GamePrice = {
  name: string;
  boys: number | null;
  girls: number | null;
};

type SportGroup = {
  id: string;
  game_name: string;
  gender: 'boys' | 'girls';
  group_title: string | null;
  group_url: string | null;
  coordinator_name: string | null;
  coordinator_phone: string | null;
  message_template: string | null;
  is_active: boolean;
  updated_at: string;
};

export default function SuperAdminPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<SportGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [genderTab, setGenderTab] = useState<'boys' | 'girls'>('boys');
  const [allGames, setAllGames] = useState<GamePrice[]>([]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SportGroup | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    gameName: '',
    gender: 'boys' as 'boys' | 'girls',
    groupTitle: '',
    groupUrl: '',
    coordinatorName: '',
    coordinatorPhone: '',
    messageTemplate: '',
    isActive: true,
  });

  const loadGames = async () => {
    try {
      const res = await fetch(`/api/games?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        setAllGames(data.data);
      }
    } catch (error) {
      console.error('Load games error:', error);
    }
  };

  useEffect(() => {
    loadGames();
    fetch('/api/admin/verify')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUserRole(data.role || 'admin');
          if (!['super_admin', 'admin'].includes(data.role)) {
            router.push('/admin/dashboard');
            return;
          }
          loadGroups();
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const loadGroups = async () => {
    setGroupsLoading(true);
    try {
      const res = await fetch('/api/admin/sport-groups', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setGroups(data.data || []);
    } finally {
      setGroupsLoading(false);
    }
  };

  const openCreateDialog = (gender: 'boys' | 'girls') => {
    setEditingGroup(null);
    setFormData({
      gameName: '',
      gender,
      groupTitle: '',
      groupUrl: '',
      coordinatorName: '',
      coordinatorPhone: '',
      messageTemplate: 'Assalam o Alaikum, I registered for {game}. My ticket # is {regNum}. Name: {name}, Roll: {roll}, Team: {teamName}. Please add me to the group.',
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (group: SportGroup) => {
    setEditingGroup(group);
    setFormData({
      gameName: group.game_name,
      gender: group.gender,
      groupTitle: group.group_title || '',
      groupUrl: group.group_url || '',
      coordinatorName: group.coordinator_name || '',
      coordinatorPhone: group.coordinator_phone || '',
      messageTemplate: group.message_template || '',
      isActive: group.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.gameName) { alert('Game name is required'); return; }

    setSaving(true);
    try {
      const method = editingGroup ? 'PUT' : 'POST';
      const body = {
        ...(editingGroup && { id: editingGroup.id }),
        gameName: formData.gameName,
        gender: formData.gender,
        groupTitle: formData.groupTitle || `${formData.gameName} (${formData.gender === 'boys' ? 'Male' : 'Female'})`,
        groupUrl: formData.groupUrl || null,
        coordinatorName: formData.coordinatorName || null,
        coordinatorPhone: formData.coordinatorPhone || null,
        messageTemplate: formData.messageTemplate || null,
        isActive: formData.isActive,
      };

      const res = await fetch('/api/admin/sport-groups', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        loadGroups();
      } else {
        alert('Failed: ' + (data.error || 'Unknown error'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (group: SportGroup) => {
    if (!confirm(`Delete the ${group.gender} group for "${group.game_name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/sport-groups?id=${group.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) loadGroups();
      else alert('Failed: ' + (data.error || 'Unknown error'));
    } catch {
      alert('Failed to delete');
    }
  };

  const toggleActive = async (group: SportGroup) => {
    try {
      const res = await fetch('/api/admin/sport-groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: group.id, isActive: !group.is_active }),
      });
      if ((await res.json()).success) loadGroups();
    } catch {}
  };

  // Filter groups by gender
  const boysGroups = groups.filter((g) => g.gender === 'boys');
  const girlsGroups = groups.filter((g) => g.gender === 'girls');
  const currentGroups = genderTab === 'boys' ? boysGroups : girlsGroups;

  // Get games that don't have a group for the current gender tab
  const existingGamesForGender = currentGroups.map((g) => g.game_name);
  const availableGames = allGames.map((g) => g.name).filter((name) => !existingGamesForGender.includes(name));

  const isSuperAdmin = userRole === 'super_admin';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 pt-16 lg:pt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          Sport Groups
        </h1>
        <p className="text-slate-500 mt-1">Manage WhatsApp groups for Male and Female separately</p>
      </div>

      {/* Info Card */}
      <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Link2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Gender-Specific Groups</h3>
              <p className="text-purple-100 text-sm">
                Each game has <strong>separate groups</strong> for Male and Female. Configure WhatsApp links and coordinator contacts for each.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gender Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          onClick={() => setGenderTab('boys')}
          variant={genderTab === 'boys' ? 'default' : 'outline'}
          className={genderTab === 'boys' ? 'bg-blue-600 hover:bg-blue-700' : ''}
        >
          <User className="h-4 w-4 mr-2" />
          Male ({boysGroups.length})
        </Button>
        <Button
          onClick={() => setGenderTab('girls')}
          variant={genderTab === 'girls' ? 'default' : 'outline'}
          className={genderTab === 'girls' ? 'bg-pink-500 hover:bg-pink-600' : ''}
        >
          <UserCircle2 className="h-4 w-4 mr-2" />
          Female ({girlsGroups.length})
        </Button>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-600">{currentGroups.length} {genderTab} group(s) configured</p>
        {isSuperAdmin && (
          <Button onClick={() => openCreateDialog(genderTab)} className={genderTab === 'boys' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-pink-500 hover:bg-pink-600'}>
            <Plus className="h-4 w-4 mr-2" />
            Add {genderTab === 'boys' ? 'Male' : 'Female'} Group
          </Button>
        )}
      </div>

      {/* Groups Grid */}
      {groupsLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
        </div>
      ) : currentGroups.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16 text-center">
            <Link2 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 mb-4">No {genderTab} groups configured yet</p>
            {isSuperAdmin && (
              <Button onClick={() => openCreateDialog(genderTab)} className={genderTab === 'boys' ? 'bg-blue-600' : 'bg-pink-500'}>
                <Plus className="h-4 w-4 mr-2" />
                Add First {genderTab === 'boys' ? 'Male' : 'Female'} Group
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentGroups.map((group) => (
            <Card key={group.id} className={`border-0 shadow-lg overflow-hidden ${!group.is_active ? 'opacity-60' : ''}`}>
              <div className={`h-1 ${group.is_active ? (group.gender === 'boys' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-pink-500 to-rose-500') : 'bg-slate-300'}`}></div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${group.gender === 'boys' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {group.gender === 'boys' ? '♂ Male' : '♀ Female'}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{group.group_title || group.game_name}</CardTitle>
                    <CardDescription>Game: {group.game_name}</CardDescription>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${group.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {group.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.group_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <Link2 className="h-4 w-4 text-purple-500" />
                    <a href={group.group_url} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline truncate">
                      {group.group_url}
                    </a>
                  </div>
                )}
                {group.coordinator_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>{group.coordinator_name}</span>
                  </div>
                )}
                {group.coordinator_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{group.coordinator_phone}</span>
                  </div>
                )}
                {group.message_template && (
                  <div className="flex items-start gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-slate-400 mt-0.5" />
                    <span className="text-slate-500 text-xs line-clamp-2">{group.message_template}</span>
                  </div>
                )}
                
                {isSuperAdmin && (
                  <div className="flex gap-2 pt-3 border-t">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(group)} className="flex-1">
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(group)} className={group.is_active ? 'text-amber-600' : 'text-emerald-600'}>
                      {group.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(group)} className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Add */}
      {isSuperAdmin && availableGames.length > 0 && (
        <Card className="mt-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Quick Add {genderTab === 'boys' ? 'Male' : 'Female'} Games</CardTitle>
            <CardDescription>Games without {genderTab} groups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableGames.map((gameName) => (
                <Button
                  key={gameName}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingGroup(null);
                    setFormData({
                      gameName,
                      gender: genderTab,
                      groupTitle: `${gameName} (${genderTab === 'boys' ? 'Male' : 'Female'})`,
                      groupUrl: '',
                      coordinatorName: '',
                      coordinatorPhone: '',
                      messageTemplate: 'Assalam o Alaikum, I registered for {game}. My ticket # is {regNum}. Name: {name}, Roll: {roll}, Team: {teamName}. Please add me to the group.',
                      isActive: true,
                    });
                    setDialogOpen(true);
                  }}
                  className={`border-dashed ${genderTab === 'boys' ? 'hover:border-blue-400 hover:text-blue-600' : 'hover:border-pink-400 hover:text-pink-600'}`}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {gameName}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {formData.gender === 'boys' ? (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-sm">♂ Male</span>
              ) : (
                <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-sm">♀ Female</span>
              )}
              {editingGroup ? 'Edit Sport Group' : 'Add Sport Group'}
            </DialogTitle>
            <DialogDescription>Configure the WhatsApp group link and coordinator details for {formData.gender}.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Game Name *</Label>
                {editingGroup ? (
                  <Input value={formData.gameName} disabled className="bg-slate-50" />
                ) : (
                  <Select value={formData.gameName} onValueChange={(v) => setFormData({ ...formData, gameName: v, groupTitle: `${v} (${formData.gender === 'boys' ? 'Male' : 'Female'})` })}>
                    <SelectTrigger><SelectValue placeholder="Select a game" /></SelectTrigger>
                    <SelectContent>
                      {availableGames.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v as 'boys' | 'girls' })} disabled={!!editingGroup}>
                  <SelectTrigger className={editingGroup ? 'bg-slate-50' : ''}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boys">Male</SelectItem>
                    <SelectItem value="girls">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Group Title</Label>
              <Input value={formData.groupTitle} onChange={(e) => setFormData({ ...formData, groupTitle: e.target.value })} />
            </div>
            
            <div className="space-y-2">
              <Label>Group URL</Label>
              <Input value={formData.groupUrl} onChange={(e) => setFormData({ ...formData, groupUrl: e.target.value })} placeholder="https://chat.whatsapp.com/..." />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Coordinator Name</Label>
                <Input value={formData.coordinatorName} onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Coordinator Phone</Label>
                <Input value={formData.coordinatorPhone} onChange={(e) => setFormData({ ...formData, coordinatorPhone: e.target.value })} placeholder="03001234567" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Message Template</Label>
              <textarea
                value={formData.messageTemplate}
                onChange={(e) => setFormData({ ...formData, messageTemplate: e.target.value })}
                placeholder="Use {game}, {regNum}, {name}, {roll}, {phone}"
                className="w-full h-20 px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded" />
              <Label htmlFor="isActive" className="font-normal cursor-pointer">Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formData.gameName} className={formData.gender === 'boys' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-pink-500 hover:bg-pink-600'}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              {editingGroup ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
