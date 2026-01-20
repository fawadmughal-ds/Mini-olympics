'use client';

import { useState, useEffect, useRef } from 'react';
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
  Wallet,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Image as ImageIcon,
  FileText,
  Search,
  Loader2,
  Check,
  ArrowUpCircle,
  ArrowDownCircle,
  Scale,
  Users,
  Clock,
  CheckCircle,
  RefreshCw,
  Upload,
  Download,
  X,
  Eye,
  FileSpreadsheet,
  Printer,
  Hash,
} from 'lucide-react';
import { jsPDF } from 'jspdf';

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

type RegistrationStats = {
  totalRegistrations: number;
  verifiedRegistrations: number;
  pendingRegistrations: number;
  totalCollected: number;
  pendingAmount: number;
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
  const [registrationStats, setRegistrationStats] = useState<RegistrationStats>({
    totalRegistrations: 0,
    verifiedRegistrations: 0,
    pendingRegistrations: 0,
    totalCollected: 0,
    pendingAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Form state
  const [form, setForm] = useState({
    recordType: 'income' as 'income' | 'expense',
    category: '',
    amount: 0,
    description: '',
    paymentMethod: '',
    recordDate: new Date().toISOString().split('T')[0],
    receiptImage: '' as string,
  });
  const [downloading, setDownloading] = useState(false);
  const [downloadingReceipts, setDownloadingReceipts] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setRegistrationStats(data.registrationStats || {
          totalRegistrations: 0,
          verifiedRegistrations: 0,
          pendingRegistrations: 0,
          totalCollected: 0,
          pendingAmount: 0,
        });
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
      receiptImage: '',
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
      receiptImage: record.attachments?.[0]?.file_url || '',
    });
    setDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setForm({ ...form, receiptImage: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate Finance Report PDF (Sheet style)
  const handleDownloadReport = async () => {
    setDownloading(true);
    
    try {
      const pdf = new jsPDF('landscape');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header
      pdf.setFillColor(16, 185, 129); // emerald
      pdf.rect(0, 0, pageWidth, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MINI OLYMPICS 2026 - FINANCE REPORT', pageWidth / 2, 16, { align: 'center' });
      
      // Date range
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const dateRange = startDate && endDate 
        ? `Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
        : `Generated: ${new Date().toLocaleDateString()}`;
      pdf.text(dateRange, 14, 35);
      
      // Summary Box
      pdf.setFillColor(240, 253, 244); // light green
      pdf.rect(14, 40, 80, 30, 'F');
      pdf.setFillColor(254, 242, 242); // light red
      pdf.rect(100, 40, 80, 30, 'F');
      pdf.setFillColor(239, 246, 255); // light blue
      pdf.rect(186, 40, 80, 30, 'F');
      
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text('TOTAL INCOME', 54, 48, { align: 'center' });
      pdf.text('TOTAL EXPENSES', 140, 48, { align: 'center' });
      pdf.text('BALANCE', 226, 48, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(16, 185, 129);
      pdf.text(`Rs. ${summary.totalIncome.toLocaleString()}`, 54, 60, { align: 'center' });
      pdf.setTextColor(239, 68, 68);
      pdf.text(`Rs. ${summary.totalExpense.toLocaleString()}`, 140, 60, { align: 'center' });
      pdf.setTextColor(59, 130, 246);
      pdf.text(`Rs. ${summary.balance.toLocaleString()}`, 226, 60, { align: 'center' });
      
      // Table Header
      let y = 80;
      pdf.setFillColor(30, 41, 59); // slate-800
      pdf.rect(14, y, pageWidth - 28, 10, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      
      const cols = [14, 28, 58, 100, 140, 185, 220, 250];
      pdf.text('S#', cols[0] + 2, y + 7);
      pdf.text('DATE', cols[1] + 2, y + 7);
      pdf.text('TYPE', cols[2] + 2, y + 7);
      pdf.text('CATEGORY', cols[3] + 2, y + 7);
      pdf.text('DESCRIPTION', cols[4] + 2, y + 7);
      pdf.text('PAYMENT', cols[5] + 2, y + 7);
      pdf.text('AMOUNT', cols[6] + 2, y + 7);
      pdf.text('BY', cols[7] + 2, y + 7);
      
      y += 10;
      
      // Table Rows
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      
      let runningBalance = 0;
      
      filteredRecords.forEach((record, index) => {
        if (y > pageHeight - 30) {
          pdf.addPage('landscape');
          y = 20;
          
          // Repeat header on new page
          pdf.setFillColor(30, 41, 59);
          pdf.rect(14, y, pageWidth - 28, 10, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.text('S#', cols[0] + 2, y + 7);
          pdf.text('DATE', cols[1] + 2, y + 7);
          pdf.text('TYPE', cols[2] + 2, y + 7);
          pdf.text('CATEGORY', cols[3] + 2, y + 7);
          pdf.text('DESCRIPTION', cols[4] + 2, y + 7);
          pdf.text('PAYMENT', cols[5] + 2, y + 7);
          pdf.text('AMOUNT', cols[6] + 2, y + 7);
          pdf.text('BY', cols[7] + 2, y + 7);
          y += 10;
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
        }
        
        // Alternating row colors
        if (index % 2 === 0) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(14, y, pageWidth - 28, 8, 'F');
        }
        
        const amount = Number(record.amount);
        if (record.record_type === 'income') {
          runningBalance += amount;
        } else {
          runningBalance -= amount;
        }
        
        pdf.setTextColor(0, 0, 0);
        pdf.text(String(index + 1), cols[0] + 2, y + 6);
        pdf.text(new Date(record.record_date).toLocaleDateString(), cols[1] + 2, y + 6);
        
        // Type with color
        if (record.record_type === 'income') {
          pdf.setTextColor(16, 185, 129);
          pdf.text('Income', cols[2] + 2, y + 6);
        } else {
          pdf.setTextColor(239, 68, 68);
          pdf.text('Expense', cols[2] + 2, y + 6);
        }
        
        pdf.setTextColor(0, 0, 0);
        pdf.text(getCategoryLabel(record.category, record.record_type).substring(0, 20), cols[3] + 2, y + 6);
        pdf.text((record.description || '-').substring(0, 25), cols[4] + 2, y + 6);
        pdf.text(getPaymentLabel(record.payment_method), cols[5] + 2, y + 6);
        
        // Amount with color
        if (record.record_type === 'income') {
          pdf.setTextColor(16, 185, 129);
          pdf.text(`+${amount.toLocaleString()}`, cols[6] + 2, y + 6);
        } else {
          pdf.setTextColor(239, 68, 68);
          pdf.text(`-${amount.toLocaleString()}`, cols[6] + 2, y + 6);
        }
        
        pdf.setTextColor(0, 0, 0);
        pdf.text((record.recorded_by || 'system').substring(0, 10), cols[7] + 2, y + 6);
        
        y += 8;
      });
      
      // Footer totals
      y += 5;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(14, y, pageWidth - 14, y);
      y += 8;
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Total Records: ${filteredRecords.length}`, 14, y);
      pdf.text(`Income: Rs. ${summary.totalIncome.toLocaleString()}`, 100, y);
      pdf.text(`Expenses: Rs. ${summary.totalExpense.toLocaleString()}`, 180, y);
      pdf.setTextColor(summary.balance >= 0 ? 16 : 239, summary.balance >= 0 ? 185 : 68, summary.balance >= 0 ? 129 : 68);
      pdf.text(`Balance: Rs. ${summary.balance.toLocaleString()}`, 250, y);
      
      // Registration Stats on new page
      pdf.addPage('landscape');
      
      pdf.setFillColor(139, 92, 246); // purple
      pdf.rect(0, 0, pageWidth, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REGISTRATION SUMMARY', pageWidth / 2, 16, { align: 'center' });
      
      // Stats boxes
      const boxWidth = 50;
      const boxSpacing = 6;
      const startX = (pageWidth - (5 * boxWidth + 4 * boxSpacing)) / 2;
      
      const stats = [
        { label: 'Total Registrations', value: registrationStats.totalRegistrations, color: [139, 92, 246] },
        { label: 'Verified', value: registrationStats.verifiedRegistrations, color: [16, 185, 129] },
        { label: 'Pending', value: registrationStats.pendingRegistrations, color: [245, 158, 11] },
        { label: 'Collected', value: `Rs. ${registrationStats.totalCollected.toLocaleString()}`, color: [20, 184, 166] },
        { label: 'Pending Amount', value: `Rs. ${registrationStats.pendingAmount.toLocaleString()}`, color: [100, 116, 139] },
      ];
      
      stats.forEach((stat, i) => {
        const x = startX + i * (boxWidth + boxSpacing);
        pdf.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
        pdf.roundedRect(x, 40, boxWidth, 35, 3, 3, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(stat.label, x + boxWidth / 2, 50, { align: 'center' });
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(stat.value), x + boxWidth / 2, 65, { align: 'center' });
      });
      
      // Footer
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on ${new Date().toLocaleString()} | Mini Olympics 2026 Finance System`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      const dateStr = startDate && endDate 
        ? `${startDate}_to_${endDate}` 
        : new Date().toISOString().split('T')[0];
      pdf.save(`Finance_Report_${dateStr}.pdf`);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  // Export all receipt images to a combined PDF
  const handleExportReceiptsPDF = async () => {
    const recordsWithReceipts = filteredRecords.filter(r => r.attachments?.length > 0 && r.attachments[0].file_url);
    
    if (recordsWithReceipts.length === 0) {
      alert('No receipts to export');
      return;
    }

    setDownloadingReceipts(true);
    
    try {
      const pdf = new jsPDF('portrait');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      for (let i = 0; i < recordsWithReceipts.length; i++) {
        const record = recordsWithReceipts[i];
        const imageUrl = record.attachments[0].file_url;
        
        if (i > 0) {
          pdf.addPage('portrait');
        }
        
        // Header for each receipt
        pdf.setFillColor(16, 185, 129);
        pdf.rect(0, 0, pageWidth, 30, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Receipt #${i + 1} of ${recordsWithReceipts.length}`, pageWidth / 2, 12, { align: 'center' });
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${record.record_type.toUpperCase()} - ${getCategoryLabel(record.category, record.record_type)}`, pageWidth / 2, 20, { align: 'center' });
        pdf.text(`Rs. ${Number(record.amount).toLocaleString()} | ${new Date(record.record_date).toLocaleDateString()}`, pageWidth / 2, 27, { align: 'center' });
        
        // Add description if exists
        if (record.description) {
          pdf.setTextColor(100, 100, 100);
          pdf.setFontSize(9);
          pdf.text(`Note: ${record.description.substring(0, 80)}${record.description.length > 80 ? '...' : ''}`, 10, 40);
        }
        
        // Add the image with proper aspect ratio
        try {
          // For base64 images
          if (imageUrl.startsWith('data:image')) {
            const imageType = imageUrl.includes('png') ? 'PNG' : 'JPEG';
            const imgY = record.description ? 50 : 40;
            const maxImgHeight = pageHeight - imgY - 20;
            const maxImgWidth = pageWidth - 20;
            
            // Load image to get dimensions
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject();
              img.src = imageUrl;
            });
            
            // Calculate dimensions maintaining aspect ratio
            const imgAspectRatio = img.width / img.height;
            let finalWidth = maxImgWidth;
            let finalHeight = finalWidth / imgAspectRatio;
            
            // If height exceeds max, scale down based on height
            if (finalHeight > maxImgHeight) {
              finalHeight = maxImgHeight;
              finalWidth = finalHeight * imgAspectRatio;
            }
            
            // Center the image horizontally
            const imgX = (pageWidth - finalWidth) / 2;
            
            // Add image centered with correct aspect ratio
            pdf.addImage(imageUrl, imageType, imgX, imgY, finalWidth, finalHeight, undefined, 'FAST');
          }
        } catch (imgError) {
          console.error('Failed to add image:', imgError);
          pdf.setTextColor(200, 0, 0);
          pdf.setFontSize(12);
          pdf.text('Failed to load image', pageWidth / 2, 100, { align: 'center' });
        }
        
        // Footer
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(8);
        pdf.text(`Recorded by: ${record.recorded_by || 'system'} | Mini Olympics 2026`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
      
      // Summary page
      pdf.addPage('portrait');
      pdf.setFillColor(139, 92, 246);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RECEIPTS SUMMARY', pageWidth / 2, 18, { align: 'center' });
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      let y = 50;
      
      pdf.text(`Total Receipts: ${recordsWithReceipts.length}`, 20, y);
      y += 15;
      
      const incomeReceipts = recordsWithReceipts.filter(r => r.record_type === 'income');
      const expenseReceipts = recordsWithReceipts.filter(r => r.record_type === 'expense');
      const incomeTotal = incomeReceipts.reduce((sum, r) => sum + Number(r.amount), 0);
      const expenseTotal = expenseReceipts.reduce((sum, r) => sum + Number(r.amount), 0);
      
      pdf.setTextColor(16, 185, 129);
      pdf.text(`Income Receipts: ${incomeReceipts.length} (Rs. ${incomeTotal.toLocaleString()})`, 20, y);
      y += 10;
      
      pdf.setTextColor(239, 68, 68);
      pdf.text(`Expense Receipts: ${expenseReceipts.length} (Rs. ${expenseTotal.toLocaleString()})`, 20, y);
      y += 20;
      
      // List all receipts
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Receipt Details:', 20, y);
      y += 10;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      
      recordsWithReceipts.forEach((record, idx) => {
        if (y > pageHeight - 30) {
          pdf.addPage('portrait');
          y = 20;
        }
        
        const typeColor = record.record_type === 'income' ? [16, 185, 129] : [239, 68, 68];
        pdf.setTextColor(typeColor[0], typeColor[1], typeColor[2]);
        const sign = record.record_type === 'income' ? '+' : '-';
        pdf.text(`${idx + 1}. ${new Date(record.record_date).toLocaleDateString()} - ${getCategoryLabel(record.category, record.record_type)} - ${sign}Rs. ${Number(record.amount).toLocaleString()}`, 25, y);
        y += 7;
      });
      
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(8);
      pdf.text(`Generated on ${new Date().toLocaleString()} | Mini Olympics 2026 Finance System`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      const dateStr = startDate && endDate 
        ? `${startDate}_to_${endDate}` 
        : new Date().toISOString().split('T')[0];
      pdf.save(`Receipts_${dateStr}.pdf`);
      
    } catch (error) {
      console.error('Receipt PDF generation error:', error);
      alert('Failed to generate receipts PDF');
    } finally {
      setDownloadingReceipts(false);
    }
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
        attachments: form.receiptImage ? [{ fileUrl: form.receiptImage, fileName: `receipt_${form.recordDate}` }] : [],
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

  const handleSync = async () => {
    if (!confirm('This will import all paid registrations as income records. Continue?')) return;
    
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/finance/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Synced ${data.synced} registrations to finance records.`);
        loadData();
      } else {
        alert('Sync failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch = (r.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getCategoryLabel = (category: string, type: string) => {
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return categories.find((c) => c.value === category)?.label || category;
  };

  const getPaymentLabel = (method: string | null) => {
    if (!method) return '-';
    return PAYMENT_METHODS.find((p) => p.value === method)?.label || method;
  };

  if (loading && records.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-lg">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          Finance Management
        </h1>
        <p className="text-slate-500 text-sm mt-1">Track income, expenses, and generate reports</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {/* Registration Stats */}
        <Card className="border-0 shadow-sm bg-purple-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 opacity-80" />
              <span className="text-xs opacity-80">Registrations</span>
            </div>
            <p className="text-xl font-bold mt-1">{registrationStats.totalRegistrations}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-emerald-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 opacity-80" />
              <span className="text-xs opacity-80">Verified</span>
            </div>
            <p className="text-xl font-bold mt-1">{registrationStats.verifiedRegistrations}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-amber-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 opacity-80" />
              <span className="text-xs opacity-80">Pending</span>
            </div>
            <p className="text-xl font-bold mt-1">{registrationStats.pendingRegistrations}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-teal-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 opacity-80" />
              <span className="text-xs opacity-80">Collected</span>
            </div>
            <p className="text-lg font-bold mt-1">₨{(registrationStats.totalCollected / 1000).toFixed(1)}k</p>
          </CardContent>
        </Card>

        {/* Finance Summary */}
        <Card className="border-0 shadow-sm bg-green-600 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 opacity-80" />
              <span className="text-xs opacity-80">Income</span>
            </div>
            <p className="text-lg font-bold mt-1">₨{(summary.totalIncome / 1000).toFixed(1)}k</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-rose-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 opacity-80" />
              <span className="text-xs opacity-80">Expenses</span>
            </div>
            <p className="text-lg font-bold mt-1">₨{(summary.totalExpense / 1000).toFixed(1)}k</p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-sm ${summary.balance >= 0 ? 'bg-blue-600' : 'bg-orange-500'} text-white`}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 opacity-80" />
              <span className="text-xs opacity-80">Balance</span>
            </div>
            <p className="text-lg font-bold mt-1">₨{(summary.balance / 1000).toFixed(1)}k</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-slate-600 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 opacity-80" />
              <span className="text-xs opacity-80">Records</span>
            </div>
            <p className="text-xl font-bold mt-1">{filteredRecords.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions & Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => openCreateDialog('income')} className="bg-emerald-500 hover:bg-emerald-600">
            <ArrowUpCircle className="h-4 w-4 mr-1" />
            Income
          </Button>
          <Button size="sm" onClick={() => openCreateDialog('expense')} className="bg-rose-500 hover:bg-rose-600">
            <ArrowDownCircle className="h-4 w-4 mr-1" />
            Expense
          </Button>
          <Button size="sm" onClick={handleSync} disabled={syncing} variant="outline">
            {syncing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Sync
          </Button>
          <Button size="sm" onClick={handleDownloadReport} disabled={downloading} variant="outline" className="text-blue-600 border-blue-300">
            {downloading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-1" />}
            Report
          </Button>
          <Button 
            size="sm" 
            onClick={handleExportReceiptsPDF} 
            disabled={downloadingReceipts || filteredRecords.filter(r => r.attachments?.length > 0).length === 0} 
            variant="outline" 
            className="text-purple-600 border-purple-300"
          >
            {downloadingReceipts ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ImageIcon className="h-4 w-4 mr-1" />}
            Export Receipts ({filteredRecords.filter(r => r.attachments?.length > 0 && r.attachments[0].file_url).length})
          </Button>
        </div>
        
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-28 h-9 text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-32 h-9 text-sm"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-32 h-9 text-sm"
          />
        </div>
      </div>

      {/* Records Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-800 hover:bg-slate-800">
                <TableHead className="text-white font-semibold w-12">S#</TableHead>
                <TableHead className="text-white font-semibold">Date</TableHead>
                <TableHead className="text-white font-semibold">Type</TableHead>
                <TableHead className="text-white font-semibold">Category</TableHead>
                <TableHead className="text-white font-semibold">Description</TableHead>
                <TableHead className="text-white font-semibold">Payment</TableHead>
                <TableHead className="text-white font-semibold text-right">Amount</TableHead>
                <TableHead className="text-white font-semibold">Receipt</TableHead>
                <TableHead className="text-white font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record, index) => (
                  <TableRow key={record.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                    <TableCell className="text-sm">{new Date(record.record_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        record.record_type === 'income' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {record.record_type === 'income' ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                        {record.record_type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{getCategoryLabel(record.category, record.record_type)}</TableCell>
                    <TableCell className="text-sm text-slate-600 max-w-xs truncate">{record.description || '-'}</TableCell>
                    <TableCell className="text-sm">{getPaymentLabel(record.payment_method)}</TableCell>
                    <TableCell className={`text-right font-semibold ${
                      record.record_type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {record.record_type === 'income' ? '+' : '-'}Rs. {Number(record.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {record.attachments?.length > 0 && record.attachments[0].file_url ? (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 px-2 text-blue-600"
                          onClick={() => setPreviewImage(record.attachments[0].file_url)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      ) : (
                        <span className="text-slate-300 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(record)} className="h-7 w-7 p-0">
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(record)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Table Footer Summary */}
        {filteredRecords.length > 0 && (
          <div className="bg-slate-100 px-4 py-3 flex flex-wrap gap-4 justify-between items-center border-t">
            <div className="text-sm text-slate-600">
              Showing <span className="font-semibold">{filteredRecords.length}</span> records
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-slate-500">Total Income:</span>{' '}
                <span className="font-semibold text-emerald-600">Rs. {summary.totalIncome.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500">Total Expenses:</span>{' '}
                <span className="font-semibold text-rose-600">Rs. {summary.totalExpense.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500">Balance:</span>{' '}
                <span className={`font-semibold ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  Rs. {summary.balance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {form.recordType === 'income' ? (
                <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <ArrowDownCircle className="h-5 w-5 text-rose-500" />
              )}
              {editingRecord ? 'Edit Record' : form.recordType === 'income' ? 'Add Income' : 'Add Expense'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={form.recordType} onValueChange={(v) => setForm({ ...form, recordType: v as 'income' | 'expense', category: '' })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {(form.recordType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Amount (Rs.) *</Label>
                <Input
                  type="number"
                  min="0"
                  className="h-9"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                className="h-9"
                value={form.recordDate}
                onChange={(e) => setForm({ ...form, recordDate: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Notes..."
                className="w-full h-16 px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Receipt Image</Label>
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-9"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {form.receiptImage ? 'Change Image' : 'Upload Receipt'}
                </Button>
                {form.receiptImage && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-9 w-9 p-0"
                    onClick={() => setForm({ ...form, receiptImage: '' })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {form.receiptImage && (
                <img src={form.receiptImage} alt="Receipt" className="w-full h-24 object-cover rounded-lg border mt-2" />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              size="sm"
              onClick={handleSave} 
              disabled={saving} 
              className={form.recordType === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
              {editingRecord ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-500" />
              Receipt
            </DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img src={previewImage} alt="Receipt" className="w-full rounded-lg" />
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPreviewImage(null)}>Close</Button>
            {previewImage && (
              <a href={previewImage} download="receipt.jpg" target="_blank" rel="noreferrer">
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
