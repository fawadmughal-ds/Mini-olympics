'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  AlertTriangle,
  Calendar,
  Check,
  Info,
  Loader2,
  MapPin,
  MoreVertical,
  Package,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Search,
  TrendingDown,
  TrendingUp,
  User,
  UserCheck,
  Boxes,
} from 'lucide-react';
import { createPortal } from 'react-dom';

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

type BorrowRecord = {
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

type BorrowDisplayRecord = BorrowRecord & {
  displayStatus: 'Borrowed' | 'Overdue' | 'Returned';
  isOverdue: boolean;
  isReturned: boolean;
};

const CATEGORIES = [
  { value: 'sports', label: 'Sports Equipment' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'general', label: 'General' },
];

const STATUS_BADGE = {
  Borrowed: 'bg-amber-50 text-amber-700',
  Overdue: 'bg-rose-50 text-rose-600',
  Returned: 'bg-emerald-50 text-emerald-700',
};

type ItemActionMenuProps = {
  onEdit: () => void;
  onAdjust: () => void;
  onDeactivate: () => void;
};

function ItemActionMenu({ onEdit, onAdjust, onDeactivate }: ItemActionMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !menuRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current.offsetHeight;
    const menuWidth = 200;
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;
    const bottomSpace = window.innerHeight - rect.bottom;
    const preferBottom = bottomSpace >= menuHeight + 16;
    const newPlacement = preferBottom ? 'bottom' : 'top';
    const top =
      newPlacement === 'bottom'
        ? rect.bottom + 8 + scrollY
        : rect.top - menuHeight - 8 + scrollY;
    const safeLeft = rect.left + rect.width - menuWidth;
    const clampedLeft = Math.min(Math.max(safeLeft, 12), window.innerWidth - menuWidth - 12);
    setCoords({ top, left: clampedLeft + scrollX });
    setPlacement(newPlacement);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    const handleClick = (event: MouseEvent) => {
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleResize = () => updatePosition();
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('scroll', handleResize, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('scroll', handleResize, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open, updatePosition]);

  const handleAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  const menu = (
    <div
      ref={menuRef}
      className="z-10 w-[200px] overflow-hidden rounded-xl border bg-white shadow-xl"
      style={{
        position: 'absolute',
        top: coords.top,
        left: coords.left,
        maxHeight: 240,
        overflowY: 'auto',
      }}
    >
      <button
        type="button"
        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
        onClick={() => handleAction(onAdjust)}
      >
        Adjust Stock
      </button>
      <button
        type="button"
        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
        onClick={() => handleAction(onEdit)}
      >
        Edit
      </button>
      <button
        type="button"
        className="w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-slate-50"
        onClick={() => handleAction(onDeactivate)}
      >
        Archive
      </button>
    </div>
  );

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-9 w-9 rounded-full p-0"
        ref={triggerRef}
        onClick={(event) => {
          event.preventDefault();
          setOpen((prev) => !prev);
        }}
      >
        <MoreVertical className="h-4 w-4 text-slate-600" />
      </Button>
      {open && createPortal(menu, document.body)}
    </>
  );
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [borrowedRecords, setBorrowedRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'borrowed'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemDialogMode, setItemDialogMode] = useState<'create' | 'edit' | 'adjust'>('create');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    category: 'general',
    quantity: 0,
    unit: 'pcs',
    minQuantity: 0,
    location: '',
  });
  const [saving, setSaving] = useState(false);

  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [borrowForm, setBorrowForm] = useState({
    itemId: '',
    borrowerName: '',
    borrowerRoll: '',
    borrowerPhone: '',
    quantity: 1,
    expectedReturnDate: '',
    notes: '',
  });
  const [borrowError, setBorrowError] = useState('');
  const [borrowing, setBorrowing] = useState(false);
  const [returningLoanId, setReturningLoanId] = useState<string | null>(null);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<InventoryItem | null>(null);
  const [deactivateSubmitting, setDeactivateSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, loansRes] = await Promise.all([
        fetch('/api/admin/inventory', { cache: 'no-store' }),
        fetch('/api/admin/inventory/loans', { cache: 'no-store' }),
      ]);

      const [itemsData, loansData] = await Promise.all([itemsRes.json(), loansRes.json()]);

      if (itemsData.success) setItems(itemsData.data || []);
      if (loansData.success) setBorrowedRecords(loansData.data || []);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateItemDialog = () => {
    setEditingItem(null);
    setItemDialogMode('create');
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
    setItemDialogMode('edit');
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

  const openAdjustStockDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setItemDialogMode('adjust');
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

  const toggleItemActive = async (item: InventoryItem) => {
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isActive: !item.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert('Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const openDeactivateDialog = (item: InventoryItem) => {
    setDeactivateTarget(item);
    setDeactivateDialogOpen(true);
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivateSubmitting(true);
    try {
      await toggleItemActive(deactivateTarget);
      setDeactivateDialogOpen(false);
      setDeactivateTarget(null);
    } finally {
      setDeactivateSubmitting(false);
    }
  };

  const openBorrowDialog = (item?: InventoryItem) => {
    setBorrowForm({
      itemId: item?.id || '',
      borrowerName: '',
      borrowerRoll: '',
      borrowerPhone: '',
      quantity: 1,
      expectedReturnDate: '',
      notes: '',
    });
    setBorrowError('');
    setBorrowDialogOpen(true);
  };

  const handleCreateBorrow = async () => {
    const { itemId, borrowerName, borrowerPhone, quantity } = borrowForm;
    if (!itemId || !borrowerName || !borrowerPhone) {
      setBorrowError('Item, borrower name, and phone are required.');
      return;
    }

    const targetItem = items.find((item) => item.id === itemId);
    const available = targetItem ? Math.max(targetItem.quantity, 0) : 0;
    if (quantity < 1 || quantity > available) {
      setBorrowError(`Select a quantity between 1 and ${available}.`);
      return;
    }

    setBorrowError('');
    setBorrowing(true);

    try {
      const res = await fetch('/api/admin/inventory/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          borrowerName,
          borrowerRoll: borrowForm.borrowerRoll || null,
          borrowerPhone,
          quantity,
          expectedReturnDate: borrowForm.expectedReturnDate || null,
          notes: borrowForm.notes || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBorrowDialogOpen(false);
        loadData();
      } else {
        setBorrowError(data.error || 'Unable to create borrow record.');
      }
    } catch (error) {
      console.error('Borrow error:', error);
      setBorrowError('Something went wrong. Please try again.');
    } finally {
      setBorrowing(false);
    }
  };

  const handleReturnLoan = async (record: BorrowRecord) => {
    if (!confirm(`Mark returned: ${record.borrower_name}?`)) return;

    setReturningLoanId(record.id);
    try {
      const res = await fetch('/api/admin/inventory/loans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.id, status: 'returned' }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert('Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to return');
    } finally {
      setReturningLoanId(null);
    }
  };

  const enrichedItems = useMemo(() => {
    return items.map((item) => {
      const borrowedQty = item.loanedQty || 0;
      const totalQty = item.quantity + borrowedQty;
      const availableQty = Math.max(item.quantity, 0);
      return {
        ...item,
        borrowedQty,
        totalQty,
        availableQty,
        isLowStock: availableQty <= item.min_quantity,
      };
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    return enrichedItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search) ||
        (item.location || '').toLowerCase().includes(search);
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesLowStock = !lowStockOnly || item.isLowStock;
      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [enrichedItems, searchQuery, categoryFilter, lowStockOnly]);

  const activeItems = enrichedItems.filter((item) => item.is_active);
  const totalItems = activeItems.length;
  const totalStock = activeItems.reduce((sum, item) => sum + item.totalQty, 0);
  const lowStockCount = activeItems.filter((item) => item.isLowStock).length;

  const activeBorrowRecords = useMemo(() => {
    return borrowedRecords.filter((record) => {
      const isReturned = record.status === 'returned' || Boolean(record.actual_return_date);
      return !isReturned;
    });
  }, [borrowedRecords]);

  const totalBorrowedQuantity = useMemo(() => {
    return activeBorrowRecords.reduce((sum, record) => sum + record.quantity, 0);
  }, [activeBorrowRecords]);

  const sortedBorrowedRecords = useMemo<BorrowDisplayRecord[]>(() => {
    const today = new Date();
    return [...borrowedRecords]
      .map((record) => {
        const expectedReturn = record.expected_return_date ? new Date(record.expected_return_date) : null;
        const isReturned = record.status === 'returned' || Boolean(record.actual_return_date);
        const isOverdue =
          !isReturned &&
          (record.status === 'active' || record.status === 'overdue') &&
          expectedReturn !== null &&
          expectedReturn < today;
        const displayStatus = isReturned ? 'Returned' : isOverdue ? 'Overdue' : 'Borrowed';
        return { ...record, displayStatus, isOverdue, isReturned };
      })
      .sort((a, b) => {
        if (a.displayStatus === 'Overdue' && b.displayStatus !== 'Overdue') return -1;
        if (a.displayStatus !== 'Overdue' && b.displayStatus === 'Overdue') return 1;
        if (a.displayStatus === 'Borrowed' && b.displayStatus === 'Returned') return -1;
        if (a.displayStatus === 'Returned' && b.displayStatus === 'Borrowed') return 1;
        return new Date(b.loan_date).getTime() - new Date(a.loan_date).getTime();
      });
  }, [borrowedRecords]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 pt-16 lg:pt-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          Equipment Inventory & Borrowing
        </h1>
        <p className="text-slate-500 mt-1">Track equipment stock, borrowers, and where everything is kept.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Items</p>
                <p className="text-3xl font-bold">{totalItems}</p>
              </div>
              <Boxes className="h-10 w-10 text-blue-200/70" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Total Stock</p>
                <p className="text-3xl font-bold">{totalStock}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-emerald-200/70" />
            </div>
          </CardContent>
        </Card>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Borrowed</p>
              <p className="text-3xl font-bold">{totalBorrowedQuantity}</p>
              <p className="text-xs text-amber-100/70 mt-1">Active records: {activeBorrowRecords.length}</p>
            </div>
            <UserCheck className="h-10 w-10 text-amber-200/70" />
          </div>
        </CardContent>
      </Card>
        <Card
          className={`border-0 shadow-lg text-white ${lowStockCount > 0 ? 'bg-gradient-to-br from-rose-500 to-red-600' : 'bg-gradient-to-br from-slate-500 to-slate-600'}`}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-sm">Low Stock</p>
                <p className="text-3xl font-bold">{lowStockCount}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-rose-200/70" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => setActiveTab('items')}
          variant={activeTab === 'items' ? 'default' : 'outline'}
          className={activeTab === 'items' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
        >
          <Package className="h-4 w-4 mr-2" />
          Items ({items.length})
        </Button>
        <Button
          onClick={() => setActiveTab('borrowed')}
          variant={activeTab === 'borrowed' ? 'default' : 'outline'}
          className={activeTab === 'borrowed' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Borrowed Items ({borrowedRecords.length})
        </Button>
      </div>

      {/* Items Tab */}
      {activeTab === 'items' && (
        <>
          <Card className="mb-4 border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="Search items, categories, locations"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      placeholder="Search items, categories, locations"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-11 pl-10"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-11 min-w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant={lowStockOnly ? 'default' : 'outline'}
                    className={`h-11 rounded-md ${
                      lowStockOnly
                        ? 'bg-rose-500 text-white hover:bg-rose-600'
                        : 'border-rose-200 text-rose-600 hover:border-rose-400'
                    }`}
                    onClick={() => setLowStockOnly((prev) => !prev)}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      Needs Restock
                      <Info className="h-3.5 w-3.5 text-slate-500" title="Shows items where Available ≤ Min Qty" />
                    </span>
                  </Button>
                  <Button
                    onClick={openCreateItemDialog}
                    className="h-11 rounded-md bg-amber-500 text-white hover:bg-amber-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {filteredItems.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-16 text-center">
                <Package className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg font-semibold">No items yet</p>
                <p className="text-slate-400 mb-4">Add equipment to start tracking stock and borrowers.</p>
                <Button onClick={openCreateItemDialog} className="bg-amber-500 hover:bg-amber-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardHeader className="px-5 pb-0">
                <CardTitle className="text-lg font-semibold text-slate-800">Items</CardTitle>
                <CardDescription className="text-slate-500">
                  {filteredItems.length} of {totalItems} tracked items
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed border-separate border-spacing-0">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Item</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 tracking-wide">Total Qty</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 tracking-wide">Borrowed Qty</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 tracking-wide">Available</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 tracking-wide">Min Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className={`${item.isLowStock ? 'bg-rose-50/30' : ''}`}>
                          <td className="px-4 py-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-amber-50 rounded-lg">
                                <Package className="h-4 w-4 text-amber-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] uppercase">
                                    {item.category}
                                  </span>
                                  {item.location && (
                                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                      <MapPin className="h-3 w-3" />
                                      {item.location}
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px]">
                                    {item.unit}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-slate-700">{item.totalQty}</td>
                          <td className="px-4 py-4 text-center text-sm text-slate-700">{item.borrowedQty}</td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold">
                              {item.availableQty}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-slate-600">{item.min_quantity}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className={`h-9 rounded-md bg-amber-500 text-white hover:bg-amber-600 ${item.availableQty === 0 ? 'opacity-60 pointer-events-none' : ''}`}
                                onClick={() => openBorrowDialog(item)}
                                disabled={item.availableQty === 0}
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Borrow
                              </Button>
                              <ItemActionMenu
                                onEdit={() => openEditItemDialog(item)}
                                onAdjust={() => openAdjustStockDialog(item)}
                                onDeactivate={() => openDeactivateDialog(item)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Borrowed Items Tab */}
      {activeTab === 'borrowed' && (
        <>
          <Card className="mb-4 border-0 shadow-lg">
            <CardContent className="p-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-slate-600">{borrowedRecords.length} borrow record(s)</p>
                <p className="text-sm text-slate-500">
                  Total quantity borrowed: {totalBorrowedQuantity}
                </p>
              </div>
              <Button onClick={() => openBorrowDialog()} className="bg-amber-500 hover:bg-amber-600">
                <Plus className="h-4 w-4 mr-2" />
                Record Borrow
              </Button>
            </CardContent>
          </Card>

          {sortedBorrowedRecords.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-16 text-center">
                <UserCheck className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg font-semibold">No borrowed items</p>
                <p className="text-slate-400 mb-4">Records will appear once someone borrows an item.</p>
                <Button onClick={() => openBorrowDialog()} className="bg-amber-500 hover:bg-amber-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Borrow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardHeader className="px-5 pb-0">
                <CardTitle className="text-lg font-semibold text-slate-800">Borrowed Items</CardTitle>
                <CardDescription className="text-slate-500">Overdue records float to the top for quick returns.</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed border-separate border-spacing-0">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Borrower</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Item</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 tracking-wide">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Borrow Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Expected Return</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {sortedBorrowedRecords.map((record) => {
                        const canReturn = !record.isReturned;
                        return (
                          <tr key={record.id}>
                            <td className="px-4 py-4">
                              <p className="text-sm font-semibold text-slate-800">{record.borrower_name}</p>
                              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                                  {record.borrower_phone}
                                </span>
                                {record.borrower_roll && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                    Roll: {record.borrower_roll}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-sm font-semibold text-slate-800">{record.item_name}</p>
                              <p className="text-xs text-slate-500">{record.item_category}</p>
                            </td>
                            <td className="px-4 py-4 text-center text-sm text-slate-700">{record.quantity}</td>
                            <td className="px-4 py-4 text-sm text-slate-700 flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {new Date(record.loan_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-700">
                              {record.expected_return_date ? new Date(record.expected_return_date).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${STATUS_BADGE[record.displayStatus]}`}>
                                {record.displayStatus}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              {canReturn ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleReturnLoan(record)}
                                  className="bg-emerald-500 hover:bg-emerald-600"
                                  disabled={returningLoanId === record.id}
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  {returningLoanId === record.id ? 'Saving...' : 'Mark Returned'}
                                </Button>
                              ) : (
                                <span className="text-xs text-slate-400">No action</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {itemDialogMode === 'create'
                ? 'Add New Item'
                : itemDialogMode === 'adjust'
                  ? 'Adjust Stock'
                  : 'Edit Item'}
            </DialogTitle>
            <DialogDescription>
              {itemDialogMode === 'create'
                ? 'Add equipment details.'
                : itemDialogMode === 'adjust'
                  ? 'Update quantity and threshold.'
                  : 'Edit item details.'}
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
                <Select value={itemForm.category} onValueChange={(value) => setItemForm({ ...itemForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={itemForm.location}
                  onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                  placeholder="e.g., Sports Office"
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

      {/* Borrow Dialog */}
      <Dialog open={borrowDialogOpen} onOpenChange={setBorrowDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Borrow Item</DialogTitle>
            <DialogDescription>Record who is borrowing equipment today.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Item *</Label>
              <Select value={borrowForm.itemId} onValueChange={(value) => setBorrowForm({ ...borrowForm, itemId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {enrichedItems
                    .filter((item) => item.availableQty > 0)
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} ({item.availableQty} available)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Borrower Name *</Label>
                <Input
                  value={borrowForm.borrowerName}
                  onChange={(e) => setBorrowForm({ ...borrowForm, borrowerName: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Roll No (optional)</Label>
                <Input
                  value={borrowForm.borrowerRoll}
                  onChange={(e) => setBorrowForm({ ...borrowForm, borrowerRoll: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  value={borrowForm.borrowerPhone}
                  onChange={(e) => setBorrowForm({ ...borrowForm, borrowerPhone: e.target.value })}
                  placeholder="0300XXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  max={items.find((item) => item.id === borrowForm.itemId)?.quantity ?? 1}
                  value={borrowForm.quantity}
                  onChange={(e) => setBorrowForm({ ...borrowForm, quantity: Number(e.target.value) })}
                />
                <p className="text-xs text-slate-400">
                  Available: {items.find((item) => item.id === borrowForm.itemId)?.quantity ?? 0}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expected Return (optional)</Label>
              <Input
                type="date"
                value={borrowForm.expectedReturnDate}
                onChange={(e) => setBorrowForm({ ...borrowForm, expectedReturnDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                value={borrowForm.notes}
                onChange={(e) => setBorrowForm({ ...borrowForm, notes: e.target.value })}
                placeholder="Card kept: ..."
              />
            </div>
            {borrowError && <p className="text-sm text-rose-600">{borrowError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBorrowDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBorrow} disabled={borrowing} className="bg-amber-500 hover:bg-amber-600">
              {borrowing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Borrow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deactivateDialogOpen}
        onOpenChange={(open) => {
          setDeactivateDialogOpen(open);
          if (!open) {
            setDeactivateTarget(null);
            setDeactivateSubmitting(false);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Deactivate Item</DialogTitle>
            <DialogDescription>
              Deactivate this item? It will be hidden but history remains.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-slate-600 py-2">
            {deactivateTarget?.name ?? 'This item'} will no longer appear in active lists.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDeactivate}
              disabled={deactivateSubmitting}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {deactivateSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
