'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  RotateCcw,
  AlertTriangle,
  Search,
  Loader2,
  Check,
  Boxes,
  TrendingUp,
  CheckCircle,
  XCircle,
  ArrowRightLeft,
  Save,
  X,
  FileSpreadsheet,
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

type NewItemRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  location: string;
};

const CATEGORIES = [
  { value: 'sports', label: 'Sports Equipment' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'general', label: 'General' },
];

const createEmptyRow = (): NewItemRow => ({
  id: Math.random().toString(36).substr(2, 9),
  name: '',
  description: '',
  category: 'sports',
  quantity: 1,
  unit: 'pcs',
  minQuantity: 1,
  location: '',
});

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'add' | 'loans'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Sheet view for adding items
  const [newItems, setNewItems] = useState<NewItemRow[]>([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
  const [savingItems, setSavingItems] = useState(false);

  // Dialog states
  const [loanDialogOpen, setLoanDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category: 'sports',
    quantity: 1,
    unit: 'pcs',
    minQuantity: 1,
    location: '',
  });

  const [loanForm, setLoanForm] = useState({
    itemId: '',
    borrowerName: '',
    borrowerRoll: '',
    borrowerPhone: '',
    quantity: 1,
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

  // Sheet row handlers
  const updateNewItem = (index: number, field: keyof NewItemRow, value: string | number) => {
    setNewItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMoreRows = () => {
    setNewItems(prev => [...prev, createEmptyRow(), createEmptyRow(), createEmptyRow()]);
  };

  const removeRow = (index: number) => {
    if (newItems.length <= 1) return;
    setNewItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAllItems = async () => {
    const validItems = newItems.filter(item => item.name.trim() !== '');
    if (validItems.length === 0) {
      alert('Please add at least one item with a name');
      return;
    }

    setSavingItems(true);
    let successCount = 0;
    let errorCount = 0;

    for (const item of validItems) {
      try {
        const res = await fetch('/api/admin/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: item.name,
            description: item.description || null,
            category: item.category,
            quantity: Number(item.quantity),
            unit: item.unit,
            minQuantity: Number(item.minQuantity),
            location: item.location || null,
          }),
        });
        const data = await res.json();
        if (data.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (e) {
        errorCount++;
      }
    }

    setSavingItems(false);
    
    if (successCount > 0) {
      alert(`Added ${successCount} item(s) successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
      setNewItems([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
      setActiveTab('items');
      loadData();
    } else {
      alert('Failed to add items');
    }
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      description: item.description || '',
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      minQuantity: item.min_quantity,
      location: item.location || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !editForm.name) {
      alert('Name is required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          name: editForm.name,
          description: editForm.description || null,
          category: editForm.category,
          quantity: Number(editForm.quantity),
          unit: editForm.unit,
          minQuantity: Number(editForm.minQuantity),
          location: editForm.location || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditDialogOpen(false);
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
      notes: '',
    });
    setLoanDialogOpen(true);
  };

  const handleCreateLoan = async () => {
    if (!loanForm.itemId || !loanForm.borrowerName || !loanForm.borrowerPhone) {
      alert('Item, borrower name, and phone are required');
      return;
    }

    const selectedItem = items.find(i => i.id === loanForm.itemId);
    const available = selectedItem ? selectedItem.quantity - selectedItem.loanedQty : 0;
    
    if (loanForm.quantity > available) {
      alert(`Only ${available} available for loan`);
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
    if (!confirm(`Mark "${loan.item_name}" returned from ${loan.borrower_name}?`)) return;

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
  const totalStock = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalLoaned = items.reduce((sum, i) => sum + i.loanedQty, 0);
  const totalAvailable = totalStock - totalLoaned;
  const lowStockItems = items.filter((i) => (i.quantity - i.loanedQty) <= i.min_quantity).length;

  const getCategoryLabel = (cat: string) => {
    return CATEGORIES.find(c => c.value === cat)?.label || cat;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
            <Package className="h-5 w-5 text-white" />
          </div>
          Inventory Management
        </h1>
        <p className="text-slate-500 text-sm mt-1">Track equipment and manage loans</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card className="border-0 shadow-sm bg-blue-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 opacity-80" />
              <span className="text-xs opacity-80">Items</span>
            </div>
            <p className="text-xl font-bold mt-1">{totalItems}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-emerald-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 opacity-80" />
              <span className="text-xs opacity-80">Total Stock</span>
            </div>
            <p className="text-xl font-bold mt-1">{totalStock}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-teal-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 opacity-80" />
              <span className="text-xs opacity-80">Available</span>
            </div>
            <p className="text-xl font-bold mt-1">{totalAvailable}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-amber-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 opacity-80" />
              <span className="text-xs opacity-80">On Loan</span>
            </div>
            <p className="text-xl font-bold mt-1">{totalLoaned}</p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-sm ${lowStockItems > 0 ? 'bg-rose-500' : 'bg-slate-500'} text-white`}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 opacity-80" />
              <span className="text-xs opacity-80">Low Stock</span>
            </div>
            <p className="text-xl font-bold mt-1">{lowStockItems}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => setActiveTab('items')}
            variant={activeTab === 'items' ? 'default' : 'outline'}
            className={activeTab === 'items' ? 'bg-amber-500 hover:bg-amber-600' : ''}
          >
            <Package className="h-4 w-4 mr-1" />
            Items ({items.length})
          </Button>
          <Button
            size="sm"
            onClick={() => setActiveTab('add')}
            variant={activeTab === 'add' ? 'default' : 'outline'}
            className={activeTab === 'add' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
          >
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Add Items
          </Button>
          <Button
            size="sm"
            onClick={() => setActiveTab('loans')}
            variant={activeTab === 'loans' ? 'default' : 'outline'}
            className={activeTab === 'loans' ? 'bg-amber-500 hover:bg-amber-600' : ''}
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Active Loans ({loans.length})
          </Button>
        </div>
        
        {activeTab === 'items' && (
          <div className="flex flex-1 gap-2 lg:justify-end">
            <div className="relative flex-1 lg:max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {activeTab === 'loans' && (
          <div className="flex flex-1 lg:justify-end">
            <Button size="sm" onClick={() => openLoanDialog()} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="h-4 w-4 mr-1" />
              New Loan
            </Button>
          </div>
        )}
      </div>

      {/* Items Tab */}
      {activeTab === 'items' && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-800 hover:bg-slate-800">
                  <TableHead className="text-white font-semibold w-12">S#</TableHead>
                  <TableHead className="text-white font-semibold">Item Name</TableHead>
                  <TableHead className="text-white font-semibold">Category</TableHead>
                  <TableHead className="text-white font-semibold text-center">Total</TableHead>
                  <TableHead className="text-white font-semibold text-center">Available</TableHead>
                  <TableHead className="text-white font-semibold text-center">On Loan</TableHead>
                  <TableHead className="text-white font-semibold">Location</TableHead>
                  <TableHead className="text-white font-semibold">Status</TableHead>
                  <TableHead className="text-white font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                      <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      No items found. Go to "Add Items" tab to add inventory.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item, index) => {
                    const available = item.quantity - item.loanedQty;
                    const isLowStock = available <= item.min_quantity;
                    
                    return (
                      <TableRow key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-800">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-slate-400 truncate max-w-xs">{item.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                            {getCategoryLabel(item.category)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-700">
                          {item.quantity} <span className="text-xs text-slate-400 font-normal">{item.unit}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-semibold ${available > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {available}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-semibold ${item.loanedQty > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {item.loanedQty}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {item.location || '-'}
                        </TableCell>
                        <TableCell>
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-xs font-medium">
                              <AlertTriangle className="h-3 w-3" />
                              Low Stock
                            </span>
                          ) : available === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                              <XCircle className="h-3 w-3" />
                              All Loaned
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                              <CheckCircle className="h-3 w-3" />
                              Available
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => openLoanDialog(item)} 
                              className="h-7 px-2 text-amber-600"
                              disabled={available === 0}
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Loan
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openEditDialog(item)} className="h-7 w-7 p-0">
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item)} className="h-7 w-7 p-0 text-red-500">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Table Footer */}
          {filteredItems.length > 0 && (
            <div className="bg-slate-100 px-4 py-3 flex flex-wrap gap-4 justify-between items-center border-t">
              <div className="text-sm text-slate-600">
                Showing <span className="font-semibold">{filteredItems.length}</span> items
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-slate-500">Total:</span>{' '}
                  <span className="font-semibold">{totalStock}</span>
                </div>
                <div>
                  <span className="text-slate-500">Available:</span>{' '}
                  <span className="font-semibold text-emerald-600">{totalAvailable}</span>
                </div>
                <div>
                  <span className="text-slate-500">On Loan:</span>{' '}
                  <span className="font-semibold text-amber-600">{totalLoaned}</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Add Items Tab - Spreadsheet View */}
      {activeTab === 'add' && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Add Multiple Items
            </h2>
            <p className="text-emerald-100 text-sm">Fill in the rows below and click Save All to add items</p>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead className="w-12 font-semibold">#</TableHead>
                  <TableHead className="font-semibold min-w-[180px]">Item Name *</TableHead>
                  <TableHead className="font-semibold min-w-[150px]">Description</TableHead>
                  <TableHead className="font-semibold min-w-[140px]">Category</TableHead>
                  <TableHead className="font-semibold w-20 text-center">Qty</TableHead>
                  <TableHead className="font-semibold w-20 text-center">Unit</TableHead>
                  <TableHead className="font-semibold w-20 text-center">Min Qty</TableHead>
                  <TableHead className="font-semibold min-w-[120px]">Location</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newItems.map((item, index) => (
                  <TableRow key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <TableCell className="font-medium text-slate-400">{index + 1}</TableCell>
                    <TableCell>
                      <Input
                        value={item.name}
                        onChange={(e) => updateNewItem(index, 'name', e.target.value)}
                        placeholder="e.g., Football"
                        className="h-8 text-sm border-slate-200 focus:border-emerald-500"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) => updateNewItem(index, 'description', e.target.value)}
                        placeholder="Optional"
                        className="h-8 text-sm border-slate-200"
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={item.category} onValueChange={(v) => updateNewItem(index, 'category', v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateNewItem(index, 'quantity', Number(e.target.value))}
                        className="h-8 text-sm text-center border-slate-200"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.unit}
                        onChange={(e) => updateNewItem(index, 'unit', e.target.value)}
                        placeholder="pcs"
                        className="h-8 text-sm text-center border-slate-200"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={item.minQuantity}
                        onChange={(e) => updateNewItem(index, 'minQuantity', Number(e.target.value))}
                        className="h-8 text-sm text-center border-slate-200"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.location}
                        onChange={(e) => updateNewItem(index, 'location', e.target.value)}
                        placeholder="Store Room"
                        className="h-8 text-sm border-slate-200"
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeRow(index)} 
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                        disabled={newItems.length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Footer Actions */}
          <div className="bg-slate-50 px-4 py-4 flex flex-wrap gap-3 justify-between items-center border-t">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={addMoreRows}>
                <Plus className="h-4 w-4 mr-1" />
                Add More Rows
              </Button>
              <span className="text-sm text-slate-500 self-center">
                {newItems.filter(i => i.name.trim()).length} item(s) to save
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setNewItems([createEmptyRow(), createEmptyRow(), createEmptyRow()])}
              >
                Clear All
              </Button>
              <Button 
                size="sm" 
                onClick={handleSaveAllItems} 
                disabled={savingItems || newItems.every(i => !i.name.trim())}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {savingItems ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Save All Items
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Loans Tab */}
      {activeTab === 'loans' && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-800 hover:bg-slate-800">
                  <TableHead className="text-white font-semibold w-12">S#</TableHead>
                  <TableHead className="text-white font-semibold">Item</TableHead>
                  <TableHead className="text-white font-semibold text-center">Qty</TableHead>
                  <TableHead className="text-white font-semibold">Borrower</TableHead>
                  <TableHead className="text-white font-semibold">Phone</TableHead>
                  <TableHead className="text-white font-semibold">Roll#</TableHead>
                  <TableHead className="text-white font-semibold">Date</TableHead>
                  <TableHead className="text-white font-semibold">Notes</TableHead>
                  <TableHead className="text-white font-semibold text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                      <UserCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      No active loans
                    </TableCell>
                  </TableRow>
                ) : (
                  loans.map((loan, index) => (
                    <TableRow key={loan.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-800">{loan.item_name}</p>
                          <p className="text-xs text-slate-400">{getCategoryLabel(loan.item_category)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-amber-600">{loan.quantity}</TableCell>
                      <TableCell className="font-medium">{loan.borrower_name}</TableCell>
                      <TableCell className="text-sm">{loan.borrower_phone}</TableCell>
                      <TableCell className="text-sm text-slate-500">{loan.borrower_roll || '-'}</TableCell>
                      <TableCell className="text-sm">{new Date(loan.loan_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm text-slate-500 max-w-xs truncate">{loan.notes || '-'}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          onClick={() => handleReturnLoan(loan)} 
                          className="bg-emerald-500 hover:bg-emerald-600 h-7 px-2"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Return
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Edit Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Update inventory item details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Item Name *</Label>
              <Input
                className="h-9"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="e.g., Football, Cricket Bat"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Input
                className="h-9"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Optional details"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Location</Label>
                <Input
                  className="h-9"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="Store Room"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Quantity *</Label>
                <Input
                  className="h-9"
                  type="number"
                  min="0"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unit</Label>
                <Input
                  className="h-9"
                  value={editForm.unit}
                  onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                  placeholder="pcs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min Qty</Label>
                <Input
                  className="h-9"
                  type="number"
                  min="0"
                  value={editForm.minQuantity}
                  onChange={(e) => setEditForm({ ...editForm, minQuantity: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleUpdateItem} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loan Dialog */}
      <Dialog open={loanDialogOpen} onOpenChange={setLoanDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Loan</DialogTitle>
            <DialogDescription>
              Record item being loaned out
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Select Item *</Label>
              <Select value={loanForm.itemId} onValueChange={(v) => setLoanForm({ ...loanForm, itemId: v })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Choose item to loan" />
                </SelectTrigger>
                <SelectContent>
                  {items.filter((i) => i.quantity - i.loanedQty > 0).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.quantity - item.loanedQty} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Borrower Name *</Label>
                <Input
                  className="h-9"
                  value={loanForm.borrowerName}
                  onChange={(e) => setLoanForm({ ...loanForm, borrowerName: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Roll Number</Label>
                <Input
                  className="h-9"
                  value={loanForm.borrowerRoll}
                  onChange={(e) => setLoanForm({ ...loanForm, borrowerRoll: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Phone Number *</Label>
                <Input
                  className="h-9"
                  value={loanForm.borrowerPhone}
                  onChange={(e) => setLoanForm({ ...loanForm, borrowerPhone: e.target.value })}
                  placeholder="03001234567"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quantity</Label>
                <Input
                  className="h-9"
                  type="number"
                  min="1"
                  value={loanForm.quantity}
                  onChange={(e) => setLoanForm({ ...loanForm, quantity: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Input
                className="h-9"
                value={loanForm.notes}
                onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setLoanDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreateLoan} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4 mr-1" />}
              Issue Loan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
