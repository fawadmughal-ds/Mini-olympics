'use client';

import { useState, useEffect } from 'react';
import { gamesPricing } from '@/lib/games-pricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  DollarSign,
  Clock,
  XCircle,
  Download,
  CheckCircle2,
  X,
  Eye,
  Calendar,
  Mail,
  Phone,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  TrendingUp,
  CreditCard,
  Banknote,
  Search,
  LayoutDashboard,
  Loader2,
} from 'lucide-react';

type Registration = {
  id: string;
  registration_number: number | null;
  email: string;
  name: string;
  roll_number: string;
  contact_number: string;
  alternative_contact_number: string | null;
  gender: string;
  selected_games: string[] | string;
  total_amount: number;
  discount: number | null;
  payment_method: string;
  slip_id: string | null;
  transaction_id: string | null;
  screenshot_url: string | null;
  status: string;
  created_at: string;
};

type Stats = {
  total: number;
  paid: number;
  pendingOnline: number;
  pendingCash: number;
  rejected: number;
};

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    paid: 0,
    pendingOnline: 0,
    pendingCash: 0,
    rejected: 0,
  });
  const [filter, setFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateRangeStats, setDateRangeStats] = useState<{ 
    count: number; 
    totalAmount: number;
    online: { count: number; amount: number };
    cash: { count: number; amount: number };
  }>({ 
    count: 0, 
    totalAmount: 0,
    online: { count: 0, amount: 0 },
    cash: { count: 0, amount: 0 }
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    // Load stats
    fetch('/api/stats?' + new URLSearchParams({ _t: Date.now().toString() }), { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data);
        }
      })
      .catch(console.error);

    fetchRegistrations();
  };

  const fetchRegistrations = () => {
    const params = new URLSearchParams();
    if (filter !== 'all') {
      if (filter === 'paid') params.set('status', 'paid');
      else if (filter === 'pending_online') params.set('status', 'pending_online');
      else if (filter === 'pending_cash') params.set('status', 'pending_cash');
    }
    if (genderFilter !== 'all') params.set('gender', genderFilter);
    if (gameFilter !== 'all') params.set('game', gameFilter);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    fetch(`/api/registrations?${params.toString()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRegistrations(data.data);
          calculateDateRangeStats(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const calculateDateRangeStats = (regs: Registration[]) => {
    let totalAmount = 0, onlineCount = 0, onlineAmount = 0, cashCount = 0, cashAmount = 0;
    regs.forEach((reg) => {
      const finalAmount = reg.total_amount - (reg.discount || 0);
      totalAmount += finalAmount;
      if (reg.payment_method === 'online') { onlineCount++; onlineAmount += finalAmount; }
      else if (reg.payment_method === 'cash') { cashCount++; cashAmount += finalAmount; }
    });
    setDateRangeStats({ count: regs.length, totalAmount, online: { count: onlineCount, amount: onlineAmount }, cash: { count: cashCount, amount: cashAmount } });
  };

  useEffect(() => {
    fetchRegistrations();
  }, [filter, startDate, endDate, genderFilter, gameFilter]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (data.success) loadData();
      else alert('Failed: ' + data.error);
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this registration?')) return;
    try {
      const response = await fetch(`/api/registrations/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) loadData();
      else alert('Failed: ' + data.error);
    } catch (error) {
      alert('Failed to delete');
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filter !== 'all') {
      if (filter === 'paid') params.set('status', 'paid');
      else if (filter === 'pending_online') params.set('status', 'pending_online');
      else if (filter === 'pending_cash') params.set('status', 'pending_cash');
    }
    if (genderFilter !== 'all') params.set('gender', genderFilter);
    if (gameFilter !== 'all') params.set('game', gameFilter);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    window.open(`/api/export?${params.toString()}`, '_blank');
  };

  const handleView = (reg: Registration) => {
    setSelectedRegistration(reg);
    setDiscountValue(reg.discount?.toString() || '0');
    setEditingDiscount(false);
    setViewDialogOpen(true);
  };

  const handleSaveDiscount = async () => {
    if (!selectedRegistration) return;
    const discountNum = parseFloat(discountValue) || 0;
    if (discountNum < 0) { alert('Discount cannot be negative'); return; }

    setSavingDiscount(true);
    try {
      const response = await fetch(`/api/registrations/${selectedRegistration.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedRegistration.status, discount: discountNum }),
      });
      const data = await response.json();
      if (data.success) {
        setSelectedRegistration({ ...selectedRegistration, discount: discountNum });
        setEditingDiscount(false);
        fetchRegistrations();
      } else alert('Failed: ' + data.error);
    } finally {
      setSavingDiscount(false);
    }
  };

  // Search and pagination
  const searchedRegistrations = registrations.filter((reg) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return reg.name.toLowerCase().includes(q) || reg.email.toLowerCase().includes(q) ||
      reg.roll_number.toLowerCase().includes(q) || reg.contact_number.includes(q) ||
      (reg.registration_number?.toString() || '').includes(q) || (reg.slip_id || '').toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(searchedRegistrations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRegistrations = searchedRegistrations.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [filter, startDate, endDate, itemsPerPage, genderFilter, gameFilter, searchQuery]);

  if (loading && registrations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 pt-16 lg:pt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          Registration Dashboard
        </h1>
        <p className="text-slate-500 mt-1">Manage participant registrations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Paid</p>
                <p className="text-3xl font-bold">{stats.paid}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-200/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Pending Online</p>
                <p className="text-3xl font-bold">{stats.pendingOnline}</p>
              </div>
              <CreditCard className="h-8 w-8 text-amber-200/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Pending Cash</p>
                <p className="text-3xl font-bold">{stats.pendingCash}</p>
              </div>
              <Banknote className="h-8 w-8 text-purple-200/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-500 to-red-600 text-white col-span-2 sm:col-span-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-sm">Rejected</p>
                <p className="text-3xl font-bold">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-rose-200/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card className="mb-6 border-0 shadow-lg">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search by name, email, roll, phone, ticket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={showFilters ? 'border-blue-500 bg-blue-50' : ''}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-5 pt-5 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2 flex gap-3">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1" />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className="flex-1" />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending_online">Pending Online</SelectItem>
                  <SelectItem value="pending_cash">Pending Cash</SelectItem>
                </SelectContent>
              </Select>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Gender</SelectItem>
                  <SelectItem value="boys">Boys</SelectItem>
                  <SelectItem value="girls">Girls</SelectItem>
                </SelectContent>
              </Select>
              <Select value={gameFilter} onValueChange={setGameFilter}>
                <SelectTrigger><SelectValue placeholder="Game" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  {gamesPricing.map((game) => (
                    <SelectItem key={game.name} value={game.name}>{game.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtered Stats */}
      {(filter !== 'all' || genderFilter !== 'all' || gameFilter !== 'all' || startDate || endDate) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <p className="text-sm text-indigo-100">Filtered</p>
              <p className="text-2xl font-bold">{dateRangeStats.count}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardContent className="p-4">
              <p className="text-sm text-emerald-100">Total Amount</p>
              <p className="text-xl font-bold">Rs. {dateRangeStats.totalAmount.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <CardContent className="p-4">
              <p className="text-sm text-blue-100">Online ({dateRangeStats.online.count})</p>
              <p className="text-xl font-bold">Rs. {dateRangeStats.online.amount.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <p className="text-sm text-amber-100">Cash ({dateRangeStats.cash.count})</p>
              <p className="text-xl font-bold">Rs. {dateRangeStats.cash.amount.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Registrations Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-slate-50 border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Registrations</CardTitle>
              <CardDescription>{startIndex + 1}-{Math.min(startIndex + itemsPerPage, searchedRegistrations.length)} of {searchedRegistrations.length}</CardDescription>
            </div>
            <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                  <th className="p-4 text-left font-semibold">Ticket</th>
                  <th className="p-4 text-left font-semibold">Participant</th>
                  <th className="p-4 text-left font-semibold">Games</th>
                  <th className="p-4 text-left font-semibold">Amount</th>
                  <th className="p-4 text-left font-semibold">Payment</th>
                  <th className="p-4 text-left font-semibold">Status</th>
                  <th className="p-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedRegistrations.map((reg) => {
                  let selectedGames: string[] = [];
                  try { selectedGames = Array.isArray(reg.selected_games) ? reg.selected_games : JSON.parse(reg.selected_games); } catch {}
                  return (
                    <tr key={reg.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="p-4">
                        {reg.registration_number ? <span className="font-bold text-blue-600">#{reg.registration_number}</span> : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-800">{reg.name}</p>
                        <p className="text-sm text-slate-500">{reg.roll_number}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${reg.gender === 'boys' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                          {reg.gender === 'boys' ? '♂' : '♀'}
                        </span>
                        <span className="ml-2 text-sm">{selectedGames.length} game(s)</span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-emerald-600">Rs. {(reg.total_amount - (reg.discount || 0)).toLocaleString()}</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${reg.payment_method === 'online' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                          {reg.payment_method}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          reg.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          reg.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {reg.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1 opacity-70 group-hover:opacity-100">
                          <Button size="sm" variant="outline" onClick={() => handleView(reg)}><Eye className="h-4 w-4" /></Button>
                          {reg.status !== 'paid' && (
                            <Button size="sm" onClick={() => handleStatusUpdate(reg.id, 'paid')} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {reg.status !== 'rejected' && (
                            <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(reg.id, 'rejected')}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(reg.id)} className="text-slate-400 hover:text-red-600">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y">
            {paginatedRegistrations.map((reg) => {
              let selectedGames: string[] = [];
              try { selectedGames = Array.isArray(reg.selected_games) ? reg.selected_games : JSON.parse(reg.selected_games); } catch {}
              return (
                <div key={reg.id} className="p-4">
                  <div className="flex justify-between mb-2">
                    <div>
                      {reg.registration_number && <span className="font-bold text-blue-600">#{reg.registration_number}</span>}
                      <p className="font-semibold">{reg.name}</p>
                      <p className="text-sm text-slate-500">{reg.roll_number}</p>
                    </div>
                    <span className={`h-fit px-2 py-1 rounded-full text-xs font-semibold ${
                      reg.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                      reg.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {reg.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex gap-2 text-sm mb-3">
                    <span className="font-bold text-emerald-600">Rs. {(reg.total_amount - (reg.discount || 0)).toLocaleString()}</span>
                    <span>•</span>
                    <span>{selectedGames.length} game(s)</span>
                    <span>•</span>
                    <span className="capitalize">{reg.payment_method}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleView(reg)} className="flex-1">View</Button>
                    {reg.status !== 'paid' && <Button size="sm" onClick={() => handleStatusUpdate(reg.id, 'paid')} className="flex-1 bg-emerald-500">Approve</Button>}
                    {reg.status !== 'rejected' && <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(reg.id, 'rejected')} className="flex-1">Reject</Button>}
                  </div>
                </div>
              );
            })}
          </div>

          {searchedRegistrations.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No registrations found</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t p-4 flex justify-between items-center">
              <p className="text-sm text-slate-500">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                  return (
                    <Button key={pageNum} variant={currentPage === pageNum ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(pageNum)} className={currentPage === pageNum ? 'bg-blue-600' : ''}>
                      {pageNum}
                    </Button>
                  );
                })}
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-blue-600" />
              Registration Details
            </DialogTitle>
            <DialogDescription>Complete information</DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-4 mt-4">
              {selectedRegistration.registration_number && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-center text-white">
                  <p className="text-blue-100 text-sm">Ticket Number</p>
                  <p className="text-4xl font-bold">#{selectedRegistration.registration_number}</p>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-blue-600" /> Personal Info</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-slate-500">Name</p><p className="font-medium">{selectedRegistration.name}</p></div>
                  <div><p className="text-slate-500">Roll</p><p className="font-medium">{selectedRegistration.roll_number}</p></div>
                  <div><p className="text-slate-500">Gender</p><p className="font-medium capitalize">{selectedRegistration.gender}</p></div>
                  <div><p className="text-slate-500">Phone</p><p className="font-medium">{selectedRegistration.contact_number}</p></div>
                  <div className="col-span-2"><p className="text-slate-500">Email</p><p className="font-medium">{selectedRegistration.email}</p></div>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-emerald-600" /> Games</h3>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(selectedRegistration.selected_games) ? selectedRegistration.selected_games : JSON.parse(selectedRegistration.selected_games || '[]')).map((g: string) => (
                    <span key={g} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium">{g}</span>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><DollarSign className="h-4 w-4 text-amber-600" /> Payment</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-slate-500">Method</p><p className="font-medium capitalize">{selectedRegistration.payment_method}</p></div>
                  <div><p className="text-slate-500">Status</p><p className="font-medium capitalize">{selectedRegistration.status.replace('_', ' ')}</p></div>
                  <div><p className="text-slate-500">Amount</p><p className="font-medium">Rs. {selectedRegistration.total_amount?.toLocaleString()}</p></div>
                  <div>
                    <p className="text-slate-500">Discount</p>
                    {editingDiscount ? (
                      <div className="flex gap-2">
                        <Input type="number" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="w-20 h-7" />
                        <Button size="sm" onClick={handleSaveDiscount} disabled={savingDiscount}>{savingDiscount ? '...' : 'Save'}</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingDiscount(false)}>X</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-red-600">Rs. {(selectedRegistration.discount || 0).toLocaleString()}</p>
                        {selectedRegistration.status !== 'paid' && <Button size="sm" variant="outline" onClick={() => setEditingDiscount(true)} className="h-6 text-xs">Edit</Button>}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500">Final Amount</p>
                    <p className="text-2xl font-bold text-emerald-600">Rs. {(selectedRegistration.total_amount - (selectedRegistration.discount || 0)).toLocaleString()}</p>
                  </div>
                  <div className="col-span-2"><p className="text-slate-500">Reference</p><p className="font-mono text-blue-600">{selectedRegistration.slip_id || 'N/A'}</p></div>
                </div>
                {selectedRegistration.screenshot_url && (
                  <div className="mt-4">
                    <p className="text-slate-500 text-sm mb-2">Screenshot</p>
                    <img src={selectedRegistration.screenshot_url} alt="Payment" className="max-w-full rounded-lg border" />
                  </div>
                )}
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Calendar className="h-4 w-4 text-purple-600" /> Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-slate-500">ID</p><p className="font-mono text-xs break-all">{selectedRegistration.id}</p></div>
                  <div><p className="text-slate-500">Date</p><p className="font-medium">{new Date(selectedRegistration.created_at).toLocaleString()}</p></div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
