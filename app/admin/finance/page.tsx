'use client';

import { useState, useEffect } from 'react';
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
  Wallet,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Image,
  FileText,
  Search,
  Loader2,
  Check,
  ArrowUpCircle,
  ArrowDownCircle,
  Scale,
  Filter,
} from 'lucide-react';

type FinanceRecord = {
  id: string;
  record_type: 'income' | 'expense' | 'transfer';
  category: string;
  amount: number;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  payment_method: string | null;
  recorded_by: string;
  record_date: string;
  created_at: string;
  attachments: { id: string; file_url: string; file_name: string }[];
};

type Summary = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
};

const INCOME_CATEGORIES = [
  { value: 'registration', label: 'Registration Fees' },
  { value: 'sponsorship', label: 'Sponsorship' },
  { value: 'donation', label: 'Donation' },
  { value: 'other_income', label: 'Other Income' },
];

const EXPENSE_CATEGORIES = [
  { value: 'equipment', label: 'Equipment' },
  { value: 'venue', label: 'Venue Rental' },
  { value: 'printing', label: 'Printing & Stationery' },
  { value: 'refreshments', label: 'Refreshments' },
  { value: 'transport', label: 'Transport' },
  { value: 'prizes', label: 'Prizes & Awards' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other_expense', label: 'Other Expense' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'easypaisa', label: 'EasyPaisa' },
  { value: 'cheque', label: 'Cheque' },
];

export default function FinancePage() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    recordType: 'income' as 'income' | 'expense',
    category: '',
    amount: 0,
    description: '',
    paymentMethod: '',
    recordDate: new Date().toISOString().split('T')[0],
    attachmentUrl: '',
  });

  useEffect(() => {
    loadData();
  }, [typeFilter, startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/admin/finance?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();

      if (data.success) {
        setRecords(data.data || []);
        setSummary(data.summary || { totalIncome: 0, totalExpense: 0, balance: 0 });
      }
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = (type: 'income' | 'expense') => {
    setEditingRecord(null);
    setForm({
      recordType: type,
      category: '',
      amount: 0,
      description: '',
      paymentMethod: '',
      recordDate: new Date().toISOString().split('T')[0],
      attachmentUrl: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (record: FinanceRecord) => {
    setEditingRecord(record);
    setForm({
      recordType: record.record_type as 'income' | 'expense',
      category: record.category,
      amount: record.amount,
      description: record.description || '',
      paymentMethod: record.payment_method || '',
      recordDate: record.record_date,
      attachmentUrl: record.attachments?.[0]?.file_url || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.category || !form.amount) {
      alert('Category and amount are required');
      return;
    }

    setSaving(true);
    try {
      const method = editingRecord ? 'PUT' : 'POST';
      const body = {
        ...(editingRecord && { id: editingRecord.id }),
        recordType: form.recordType,
        category: form.category,
        amount: Number(form.amount),
        description: form.description || null,
        paymentMethod: form.paymentMethod || null,
        recordDate: form.recordDate,
        attachments: form.attachmentUrl ? [{ fileUrl: form.attachmentUrl }] : [],
      };

      const res = await fetch('/api/admin/finance', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        loadData();
      } else {
        alert('Failed: ' + (data.error || 'Unknown error'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: FinanceRecord) => {
    if (!confirm(`Delete this ${record.record_type} record?`)) return;

    try {
      const res = await fetch(`/api/admin/finance?id=${record.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert('Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to delete');
    }
  };

  // Filtered records
  const filteredRecords = records.filter((r) => {
    const matchesSearch = (r.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getCategoryLabel = (category: string, type: string) => {
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return categories.find((c) => c.value === category)?.label || category;
  };

  if (loading && records.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 pt-16 lg:pt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-lg">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          Finance Management
        </h1>
        <p className="text-slate-500 mt-1">Track income, expenses, and financial records</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Total Income</p>
                <p className="text-3xl font-bold mt-1">Rs. {summary.totalIncome.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingUp className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-sm font-medium">Total Expenses</p>
                <p className="text-3xl font-bold mt-1">Rs. {summary.totalExpense.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingDown className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg ${summary.balance >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'} text-white`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Balance</p>
                <p className="text-3xl font-bold mt-1">Rs. {summary.balance.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Scale className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={() => openCreateDialog('income')} className="bg-emerald-500 hover:bg-emerald-600">
          <ArrowUpCircle className="h-4 w-4 mr-2" />
          Add Income
        </Button>
        <Button onClick={() => openCreateDialog('expense')} className="bg-rose-500 hover:bg-rose-600">
          <ArrowDownCircle className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6 border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full lg:w-auto"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full lg:w-auto"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No records found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="border-0 shadow-lg overflow-hidden">
              <div className={`h-1 ${record.record_type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${record.record_type === 'income' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                      {record.record_type === 'income' ? (
                        <ArrowUpCircle className="h-6 w-6 text-emerald-600" />
                      ) : (
                        <ArrowDownCircle className="h-6 w-6 text-rose-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${record.record_type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {getCategoryLabel(record.category, record.record_type)}
                        </span>
                        {record.payment_method && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                            {PAYMENT_METHODS.find((p) => p.value === record.payment_method)?.label || record.payment_method}
                          </span>
                        )}
                      </div>
                      <p className={`text-2xl font-bold ${record.record_type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {record.record_type === 'income' ? '+' : '-'} Rs. {Number(record.amount).toLocaleString()}
                      </p>
                      {record.description && (
                        <p className="text-sm text-slate-500 mt-1">{record.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(record.record_date).toLocaleDateString()}
                        </span>
                        <span>by {record.recorded_by}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {record.attachments?.length > 0 && (
                      <a href={record.attachments[0].file_url} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="text-blue-600 border-blue-200">
                          <Image className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(record)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(record)} className="text-red-600 border-red-200 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {form.recordType === 'income' ? (
                <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <ArrowDownCircle className="h-5 w-5 text-rose-500" />
              )}
              {editingRecord ? 'Edit Record' : form.recordType === 'income' ? 'Add Income' : 'Add Expense'}
            </DialogTitle>
            <DialogDescription>
              {form.recordType === 'income' ? 'Record money received' : 'Record money spent'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.recordType} onValueChange={(v) => setForm({ ...form, recordType: v as 'income' | 'expense', category: '' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(form.recordType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (Rs.) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.recordDate}
                onChange={(e) => setForm({ ...form, recordDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description or notes"
                className="w-full h-20 px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <Label>Attachment URL (Receipt/Invoice Image)</Label>
              <Input
                value={form.attachmentUrl}
                onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                placeholder="https://..."
              />
              <p className="text-xs text-slate-500">Paste a URL to an image of the receipt or invoice</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className={form.recordType === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              {editingRecord ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
