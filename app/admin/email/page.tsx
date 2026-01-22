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
  Mail,
  Send,
  Loader2,
  Users,
  Eye,
  FileText,
  CheckCircle,
  AlertCircle,
  Image,
  X,
  Plus,
} from 'lucide-react';

type Recipient = {
  email: string;
  name: string;
  gender: string;
};

const emailTemplates = [
  {
    id: 'welcome',
    name: '🎉 Registration Confirmation',
    subject: 'Welcome to Mini Olympics 2026!',
    content: `<h2>Welcome to Mini Olympics 2026! 🏆</h2>
<p>Dear {name},</p>
<p>Thank you for registering for the FCIT Sports Mini Olympics 2026. We're excited to have you on board!</p>
<p>Your registration has been received and is currently being processed.</p>
<p><strong>What's Next?</strong></p>
<ul>
  <li>Complete your payment if not already done</li>
  <li>Join the WhatsApp groups for your registered games</li>
  <li>Stay tuned for match schedules</li>
</ul>
<p>Good luck and may the best athlete win!</p>`,
  },
  {
    id: 'payment_reminder',
    name: '💰 Payment Reminder',
    subject: 'Action Required: Complete Your Mini Olympics Payment',
    content: `<h2>Payment Reminder 💰</h2>
<p>Dear {name},</p>
<p>We noticed that your registration payment for Mini Olympics 2026 is still pending.</p>
<p>Please complete your payment as soon as possible to confirm your participation.</p>
<p><strong>Payment Options:</strong></p>
<ul>
  <li>Cash payment at the registration desk</li>
  <li>Online transfer (check registration page for details)</li>
</ul>
<p>If you have already paid, please ignore this message or contact us with your payment proof.</p>`,
  },
  {
    id: 'schedule',
    name: '📅 Match Schedule',
    subject: 'Your Match Schedule - Mini Olympics 2026',
    content: `<h2>Match Schedule Released! 📅</h2>
<p>Dear {name},</p>
<p>The match schedules for Mini Olympics 2026 are now available!</p>
<p>Please check your registered games and note down your match timings.</p>
<p><strong>Important:</strong></p>
<ul>
  <li>Arrive at least 15 minutes before your scheduled match</li>
  <li>Bring your registration ticket/ID</li>
  <li>Wear appropriate sports attire</li>
</ul>
<p>Best of luck for your matches!</p>`,
  },
  {
    id: 'announcement',
    name: '📢 General Announcement',
    subject: 'Important Update - Mini Olympics 2026',
    content: `<h2>Important Announcement 📢</h2>
<p>Dear {name},</p>
<p>[Your announcement content here]</p>
<p>Stay connected and follow our social media for live updates.</p>`,
  },
  {
    id: 'custom',
    name: '✏️ Custom Email',
    subject: '',
    content: '',
  },
];

export default function EmailComposerPage() {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  
  // Filter states
  const [recipientFilter, setRecipientFilter] = useState('paid');
  const [genderFilter, setGenderFilter] = useState('all');
  
  // Email form states
  const [selectedTemplate, setSelectedTemplate] = useState('welcome');
  const [subject, setSubject] = useState('Welcome to Mini Olympics 2026!');
  const [content, setContent] = useState(emailTemplates[0].content);
  const [customTo, setCustomTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  
  // Load recipients based on filter
  useEffect(() => {
    loadRecipients();
  }, [recipientFilter, genderFilter]);

  const loadRecipients = async () => {
    setLoadingRecipients(true);
    try {
      const params = new URLSearchParams();
      params.set('filter', recipientFilter);
      if (genderFilter !== 'all') params.set('gender', genderFilter);
      
      const res = await fetch(`/api/admin/email?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setRecipients(data.data);
      }
    } catch (error) {
      console.error('Load recipients error:', error);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setContent(template.content);
    }
  };

  const generateEmailHtml = (recipientName: string = 'Participant') => {
    const processedContent = content.replace(/{name}/g, recipientName);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center; color: white;">
            ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-width: 120px; margin-bottom: 16px;">` : '<div style="font-size: 48px; margin-bottom: 16px;">🏆</div>'}
            <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">Mini Olympics 2026</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 14px;">FCIT Sports Society</p>
          </div>
          
          <!-- Content -->
          <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <div style="color: #334155; line-height: 1.7; font-size: 15px;">
              ${processedContent}
            </div>
            
            <!-- Footer in content -->
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                Best regards,<br>
                <strong style="color: #334155;">FCIT Sports Society</strong>
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0 0 8px 0;">© 2026 FCIT Sports Society. All rights reserved.</p>
            <p style="margin: 0;">
              <a href="https://pucit.edu.pk" style="color: #3b82f6; text-decoration: none;">pucit.edu.pk</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleSendEmails = async () => {
    const toList = customTo 
      ? customTo.split(',').map(e => e.trim()).filter(e => e) 
      : recipients.map(r => r.email);

    if (toList.length === 0) {
      alert('No recipients selected');
      return;
    }

    if (!subject.trim()) {
      alert('Please enter a subject');
      return;
    }

    setSending(true);
    setSendSuccess(false);
    
    try {
      // Send emails (in batches for bulk)
      const batchSize = 50;
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < toList.length; i += batchSize) {
        const batch = toList.slice(i, i + batchSize);
        
        for (const email of batch) {
          const recipient = recipients.find(r => r.email === email);
          const html = generateEmailHtml(recipient?.name || 'Participant');
          
          try {
            const res = await fetch('/api/admin/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: email,
                cc: cc ? cc.split(',').map(e => e.trim()) : undefined,
                bcc: bcc ? bcc.split(',').map(e => e.trim()) : undefined,
                subject,
                html,
              }),
            });
            
            if (res.ok) {
              successCount++;
            } else {
              failCount++;
            }
          } catch {
            failCount++;
          }
        }
      }

      if (failCount === 0) {
        setSendSuccess(true);
        setTimeout(() => setSendSuccess(false), 5000);
        alert(`✅ Successfully sent ${successCount} email(s)!`);
      } else {
        alert(`Sent ${successCount} email(s), ${failCount} failed.`);
      }
    } catch (error: any) {
      alert('Failed to send emails: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
            <Mail className="h-5 w-5 text-white" />
          </div>
          Email Composer
        </h1>
        <p className="text-slate-500 text-sm mt-1">Send beautiful emails to participants</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Recipients */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Recipients
            </CardTitle>
            <CardDescription className="text-indigo-100">
              Select who will receive this email
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">Filter by Status</Label>
                <Select value={recipientFilter} onValueChange={setRecipientFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Registrations</SelectItem>
                    <SelectItem value="paid">Paid Only</SelectItem>
                    <SelectItem value="pending">Pending Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Filter by Gender</Label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="boys">Male</SelectItem>
                    <SelectItem value="girls">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-indigo-800">Selected Recipients</span>
                {loadingRecipients ? (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                ) : (
                  <span className="text-2xl font-bold text-indigo-600">{recipients.length}</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Or Enter Custom Emails</Label>
              <textarea
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                className="w-full h-20 px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-500">Comma-separated. Leave empty to use filtered recipients.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">CC</Label>
                <Input
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@email.com"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">BCC</Label>
                <Input
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="bcc@email.com"
                  className="text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Middle Column - Compose */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Compose Email
            </CardTitle>
            <CardDescription className="text-blue-100">
              Write your email content
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Template</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {emailTemplates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Subject *</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Logo URL (optional)</Label>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Content (HTML supported)</Label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your email content here... Use {name} for recipient's name."
                className="w-full h-64 px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-xs text-slate-500">
                Use <code className="bg-slate-100 px-1 rounded">{'{name}'}</code> to insert recipient's name
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setPreviewOpen(true)}
                variant="outline"
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleSendEmails}
                disabled={sending || (!customTo && recipients.length === 0)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : sendSuccess ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {sending ? 'Sending...' : sendSuccess ? 'Sent!' : `Send to ${customTo ? 'Custom' : recipients.length} recipient(s)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Email Preview
            </DialogTitle>
            <DialogDescription>
              This is how your email will look
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-slate-100 rounded-lg p-2 mb-4">
              <p className="text-sm"><strong>Subject:</strong> {subject}</p>
              <p className="text-sm"><strong>To:</strong> {customTo || `${recipients.length} recipients`}</p>
              {cc && <p className="text-sm"><strong>CC:</strong> {cc}</p>}
              {bcc && <p className="text-sm"><strong>BCC:</strong> {bcc}</p>}
            </div>
            <div 
              className="border rounded-lg overflow-hidden"
              dangerouslySetInnerHTML={{ __html: generateEmailHtml('John Doe') }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
