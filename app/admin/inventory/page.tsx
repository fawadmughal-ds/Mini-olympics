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
  Package,
  Plus,
  Pencil,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  UserCheck,
  RotateCcw,
  AlertTriangle,
  Search,
  Loader2,
  Check,
  X,
  Phone,
  User,
  Calendar,
  Boxes,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

type InventoryItem = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  location: string | null;
  is_active: boolean;
  activeLoans: number;
  loanedQty: number;
  created_at: string;
};

type Loan = {
  id: string;
  item_id: string;
  item_name: string;
  item_category: string;
  borrower_name: string;
  borrower_roll: string | null;
  borrower_phone: string;
  quantity: number;
  loan_date: string;
  expected_return_date: string | null;
  actual_return_date: string | null;
  status: string;
  notes: string | null;
  loaned_by: string;
};

const CATEGORIES = [
  { value: 'sports', label: 'Sports Equipment' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'general', label: 'General' },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'loans'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Dialog states
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [loanDialogOpen, setLoanDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    category: 'general',
    quantity: 0,
    unit: 'pcs',
    minQuantity: 0,
    location: '',
  });

  const [loanForm, setLoanForm] = useState({
    itemId: '',
    borrowerName: '',
    borrowerRoll: '',
    borrowerPhone: '',
    quantity: 1,
    expectedReturnDate: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, loansRes] = await Promise.all([
        fetch('/api/admin/inventory', { cache: 'no-store' }),
        fetch('/api/admin/inventory/loans?status=active', { cache: 'no-store' }),
      ]);

      const itemsData = await itemsRes.json();
      const loansData = await loansRes.json();

      if (itemsData.success) setItems(itemsData.data || []);
      if (loansData.success) setLoans(loansData.data || []);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateItemDialog = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      description: '',
      category: 'general',
      quantity: 0,
      unit: 'pcs',
      minQuantity: 0,
      location: '',
    });
    setItemDialogOpen(true);
  };

  const openEditItemDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      minQuantity: item.min_quantity,
      location: item.location || '',
    });
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!itemForm.name) {
      alert('Name is required');
      return;
    }

    setSaving(true);
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const body = {
        ...(editingItem && { id: editingItem.id }),
        name: itemForm.name,
        description: itemForm.description || null,
        category: itemForm.category,
        quantity: Number(itemForm.quantity),
        unit: itemForm.unit,
        minQuantity: Number(itemForm.minQuantity),
        location: itemForm.location || null,
      };

      const res = await fetch('/api/admin/inventory', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setItemDialogOpen(false);
        loadData();
      } else {
        alert('Failed: ' + (data.error || 'Unknown error'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/inventory?id=${item.id}`, { method: 'DELETE' });
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

  const openLoanDialog = (item?: InventoryItem) => {
    setLoanForm({
      itemId: item?.id || '',
      borrowerName: '',
      borrowerRoll: '',
      borrowerPhone: '',
      quantity: 1,
      expectedReturnDate: '',
      notes: '',
    });
    setLoanDialogOpen(true);
  };

  const handleCreateLoan = async () => {
    if (!loanForm.itemId || !loanForm.borrowerName || !loanForm.borrowerPhone) {
      alert('Item, borrower name, and phone are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/inventory/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loanForm),
      });

      const data = await res.json();
      if (data.success) {
        setLoanDialogOpen(false);
        loadData();
      } else {
        alert('Failed: ' + (data.error || 'Unknown error'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReturnLoan = async (loan: Loan) => {
    if (!confirm(`Mark loan returned from ${loan.borrower_name}?`)) return;

    try {
      const res = await fetch('/api/admin/inventory/loans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loan.id, status: 'returned' }),
      });

      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert('Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to return');
    }
  };

  // Filtered items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Stats
  const totalItems = items.length;
  const lowStockItems = items.filter((i) => i.quantity <= i.min_quantity).length;
  const activeLoansCount = loans.length;
  const totalValue = items.reduce((sum, i) => sum + i.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 pt-16 lg:pt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          Inventory Management
        </h1>
        <p className="text-slate-500 mt-1">Track equipment, supplies, and loans</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Items</p>
                <p className="text-3xl font-bold">{totalItems}</p>
              </div>
              <Boxes className="h-10 w-10 text-blue-200/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Total Stock</p>
                <p className="text-3xl font-bold">{totalValue}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-emerald-200/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Active Loans</p>
                <p className="text-3xl font-bold">{activeLoansCount}</p>
              </div>
              <UserCheck className="h-10 w-10 text-amber-200/50" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg ${lowStockItems > 0 ? 'bg-gradient-to-br from-rose-500 to-red-600' : 'bg-gradient-to-br from-slate-500 to-slate-600'} text-white`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-sm">Low Stock</p>
                <p className="text-3xl font-bold">{lowStockItems}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-rose-200/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          onClick={() => setActiveTab('items')}
          variant={activeTab === 'items' ? 'default' : 'outline'}
          className={activeTab === 'items' ? 'bg-amber-500 hover:bg-amber-600' : ''}
        >
          <Package className="h-4 w-4 mr-2" />
          Items ({items.length})
        </Button>
        <Button
          onClick={() => setActiveTab('loans')}
          variant={activeTab === 'loans' ? 'default' : 'outline'}
          className={activeTab === 'loans' ? 'bg-amber-500 hover:bg-amber-600' : ''}
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Active Loans ({loans.length})
        </Button>
      </div>

      {/* Items Tab */}
      {activeTab === 'items' && (
        <>
          {/* Search and Actions */}
          <Card className="mb-6 border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={openCreateItemDialog} className="bg-amber-500 hover:bg-amber-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Items Grid */}
          {filteredItems.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-16 text-center">
                <Package className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No items found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className={`border-0 shadow-lg overflow-hidden ${item.quantity <= item.min_quantity ? 'ring-2 ring-rose-400' : ''}`}>
                  <div className={`h-1 ${item.quantity <= item.min_quantity ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}></div>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <CardDescription className="capitalize">{item.category}</CardDescription>
                      </div>
                      <span className={`text-2xl font-bold ${item.quantity <= item.min_quantity ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {item.quantity}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {item.description && (
                      <p className="text-sm text-slate-500 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-slate-100 rounded">{item.unit}</span>
                      {item.location && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">{item.location}</span>}
                      {item.loanedQty > 0 && (
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded">
                          {item.loanedQty} on loan
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" variant="outline" onClick={() => openEditItemDialog(item)} className="flex-1">
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openLoanDialog(item)} className="flex-1 text-amber-600 border-amber-200 hover:bg-amber-50">
                        <UserCheck className="h-4 w-4 mr-1" />
                        Loan
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteItem(item)} className="text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Loans Tab */}
      {activeTab === 'loans' && (
        <>
          <Card className="mb-6 border-0 shadow-lg">
            <CardContent className="p-4 flex justify-between items-center">
              <p className="text-slate-600">{loans.length} active loan(s)</p>
              <Button onClick={() => openLoanDialog()} className="bg-amber-500 hover:bg-amber-600">
                <Plus className="h-4 w-4 mr-2" />
                New Loan
              </Button>
            </CardContent>
          </Card>

          {loans.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-16 text-center">
                <UserCheck className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No active loans</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {loans.map((loan) => (
                <Card key={loan.id} className="border-0 shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <Package className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">{loan.item_name}</h3>
                            <p className="text-sm text-slate-500">Qty: {loan.quantity} • {loan.item_category}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span>{loan.borrower_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-400" />
                            <span>{loan.borrower_phone}</span>
                          </div>
                          {loan.borrower_roll && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">Roll:</span>
                              <span>{loan.borrower_roll}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span>{new Date(loan.loan_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => handleReturnLoan(loan)} className="bg-emerald-500 hover:bg-emerald-600">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Mark Returned
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update item details' : 'Add a new inventory item'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="e.g., Football"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={itemForm.category} onValueChange={(v) => setItemForm({ ...itemForm, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={itemForm.location}
                  onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                  placeholder="e.g., Store Room A"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  value={itemForm.unit}
                  onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                  placeholder="pcs"
                />
              </div>
              <div className="space-y-2">
                <Label>Min Qty</Label>
                <Input
                  type="number"
                  min="0"
                  value={itemForm.minQuantity}
                  onChange={(e) => setItemForm({ ...itemForm, minQuantity: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveItem} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loan Dialog */}
      <Dialog open={loanDialogOpen} onOpenChange={setLoanDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Loan</DialogTitle>
            <DialogDescription>
              Record an item being loaned to someone
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Item *</Label>
              <Select value={loanForm.itemId} onValueChange={(v) => setLoanForm({ ...loanForm, itemId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {items.filter((i) => i.quantity > 0).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.quantity} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Borrower Name *</Label>
                <Input
                  value={loanForm.borrowerName}
                  onChange={(e) => setLoanForm({ ...loanForm, borrowerName: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Roll Number</Label>
                <Input
                  value={loanForm.borrowerRoll}
                  onChange={(e) => setLoanForm({ ...loanForm, borrowerRoll: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input
                  value={loanForm.borrowerPhone}
                  onChange={(e) => setLoanForm({ ...loanForm, borrowerPhone: e.target.value })}
                  placeholder="03001234567"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={loanForm.quantity}
                  onChange={(e) => setLoanForm({ ...loanForm, quantity: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expected Return Date</Label>
              <Input
                type="date"
                value={loanForm.expectedReturnDate}
                onChange={(e) => setLoanForm({ ...loanForm, expectedReturnDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={loanForm.notes}
                onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLoanDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateLoan} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Create Loan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
