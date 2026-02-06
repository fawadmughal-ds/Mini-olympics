'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  DollarSign,
  CheckCircle2,
  Package,
  Wallet,
  TrendingUp,
  Trophy,
  ArrowRight,
  Loader2,
  Medal,
  Target,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type Stats = {
  total: number;
  paid: number;
  pendingOnline: number;
  pendingCash: number;
  rejected: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    paid: 0,
    pendingOnline: 0,
    pendingCash: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [financeStats, setFinanceStats] = useState({ income: 0, expense: 0, balance: 0 });
  const [inventoryStats, setInventoryStats] = useState({ totalItems: 0, activeLoans: 0 });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load registration stats
      const statsRes = await fetch('/api/stats?' + new URLSearchParams({ _t: Date.now().toString() }), { cache: 'no-store' });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Load finance stats
      try {
        const financeRes = await fetch('/api/admin/finance', { cache: 'no-store' });
        const financeData = await financeRes.json();
        if (financeData.success && financeData.summary) {
          setFinanceStats({
            income: financeData.summary.totalIncome || 0,
            expense: financeData.summary.totalExpense || 0,
            balance: financeData.summary.balance || 0,
          });
        }
      } catch (e) {}

      // Load inventory stats
      try {
        const invRes = await fetch('/api/admin/inventory', { cache: 'no-store' });
        const invData = await invRes.json();
        if (invData.success) {
          setInventoryStats({
            totalItems: invData.data?.length || 0,
            activeLoans: 0,
          });
        }
        const loansRes = await fetch('/api/admin/inventory/loans', { cache: 'no-store' });
        const loansData = await loansRes.json();
        if (loansData.success) {
          setInventoryStats(prev => ({
            ...prev,
            activeLoans: loansData.data?.filter((l: any) => l.status === 'active')?.length || 0,
          }));
        }
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const totalPending = stats.pendingOnline + stats.pendingCash;

  return (
    <div className="p-6 lg:p-8 pt-16 lg:pt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
            <Medal className="h-6 w-6 text-white" />
          </div>
          Dashboard
        </h1>
        <p className="text-slate-500 mt-1">Mini Olympics 2026 - Overview</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Registrations */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Registrations</p>
                <p className="text-4xl font-bold mt-2">{stats.total}</p>
                <p className="text-blue-200 text-sm mt-1">{stats.paid} verified</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Pending Approvals</p>
                <p className="text-4xl font-bold mt-2">{totalPending}</p>
                <p className="text-amber-200 text-sm mt-1">Needs verification</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Finance Balance */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Finance Balance</p>
                <p className="text-4xl font-bold mt-2">Rs. {financeStats.balance.toLocaleString()}</p>
                <p className="text-emerald-200 text-sm mt-1">Income - Expense</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Inventory</p>
                <p className="text-4xl font-bold mt-2">{inventoryStats.totalItems}</p>
                <p className="text-purple-200 text-sm mt-1">{inventoryStats.activeLoans} active loans</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Registrations Card */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-500 transition-colors">
                <Users className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <CardTitle className="text-lg">Registrations</CardTitle>
                <CardDescription>Manage participants</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
                <p className="text-xs text-slate-500">Verified</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{totalPending}</p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
              <div className="text-center p-3 bg-rose-50 rounded-lg">
                <p className="text-2xl font-bold text-rose-600">{stats.rejected}</p>
                <p className="text-xs text-slate-500">Rejected</p>
              </div>
            </div>
            <Link href="/admin/registrations">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                View All Registrations
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Finance Card */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-500 transition-colors">
                <Wallet className="h-5 w-5 text-emerald-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <CardTitle className="text-lg">Finance</CardTitle>
                <CardDescription>Income & Expenses</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <p className="text-xl font-bold text-emerald-600">Rs. {financeStats.income.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Income</p>
              </div>
              <div className="text-center p-3 bg-rose-50 rounded-lg">
                <p className="text-xl font-bold text-rose-600">Rs. {financeStats.expense.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Expense</p>
              </div>
            </div>
            <Link href="/admin/finance">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                View Finance
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Inventory Card */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-500 transition-colors">
                <Package className="h-5 w-5 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <CardTitle className="text-lg">Inventory</CardTitle>
                <CardDescription>Equipment & Loans</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{inventoryStats.totalItems}</p>
                <p className="text-xs text-slate-500">Total Items</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{inventoryStats.activeLoans}</p>
                <p className="text-xs text-slate-500">Active Loans</p>
              </div>
            </div>
            <Link href="/admin/inventory">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                View Inventory
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
