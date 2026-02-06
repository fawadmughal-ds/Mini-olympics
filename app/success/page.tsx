'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Download, QrCode, Medal, Users, ArrowLeft, ExternalLink, MessageCircle, Trophy, Home } from 'lucide-react';
import QRCode from 'qrcode';

function SuccessContent() {
  const searchParams = useSearchParams();
  const registrationId = searchParams.get('id');
  const registrationNumber = searchParams.get('regNum');
  const slipId = searchParams.get('slipId');
  const method = searchParams.get('method');
  const transactionId = searchParams.get('transactionId');
  const total = searchParams.get('total');
  const [qrCode, setQrCode] = useState<string>('');
  const [groupInfo, setGroupInfo] = useState<any[]>([]);
  const [groupLoading, setGroupLoading] = useState(false);

  useEffect(() => {
    if (slipId) {
      let qrData: string;
      
      if (method === 'cash' && registrationNumber) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        qrData = `${baseUrl}/verify-cash?regNum=${registrationNumber}&slipId=${slipId}`;
      } else {
        qrData = JSON.stringify({
          type: 'MiniOlympics_Registration',
          registrationNumber: registrationNumber || '',
          slipId: slipId,
          registrationId: registrationId || '',
          amount: total || '0',
          method: method || '',
          transactionId: transactionId || '',
          timestamp: new Date().toISOString(),
        });
      }
      
      QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
        color: {
          dark: '#1e293b',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrCode(url))
        .catch(console.error);
    }
  }, [slipId, registrationNumber, registrationId, total, method, transactionId]);

  useEffect(() => {
    const loadGroups = async () => {
      if (!registrationId || !slipId || !registrationNumber) return;
      setGroupLoading(true);
      try {
        const regRes = await fetch(`/api/public/registration?id=${encodeURIComponent(registrationId)}&slipId=${encodeURIComponent(slipId)}`, {
          cache: 'no-store',
        });
        const regData = await regRes.json();
        if (!regData?.success) return;

        const selectedGames: string[] = regData.data?.selectedGames || [];
        if (!Array.isArray(selectedGames) || selectedGames.length === 0) return;

        // Get gender for filtering the correct groups (boys vs girls)
        const gender = regData.data?.gender || 'boys';

        const params = new URLSearchParams({
          games: selectedGames.join(','),
          gender: gender,
          regNum: String(registrationNumber),
          name: regData.data?.name || '',
          roll: regData.data?.rollNumber || '',
          phone: regData.data?.contactNumber || '',
          teamName: regData.data?.teamName || '',
        });

        const groupsRes = await fetch(`/api/groups?${params.toString()}`, { cache: 'no-store' });
        const groupsData = await groupsRes.json();
        if (groupsData?.success) {
          setGroupInfo(groupsData.data || []);
        }
      } finally {
        setGroupLoading(false);
      }
    };

    loadGroups();
  }, [registrationId, slipId, registrationNumber]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50"></div>
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500"></div>
      <div className="absolute top-0 left-0 w-full h-96 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23FFFFFF%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>

      <div className="relative container mx-auto px-4 py-12 max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-5 bg-white rounded-full shadow-2xl shadow-emerald-500/30 mb-6">
            <div className="p-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3">Registration Successful!</h1>
          <p className="text-emerald-100 text-lg">Your registration has been submitted successfully</p>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            {/* Ticket Number Banner */}
            {registrationNumber && (
              <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 p-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Medal className="h-6 w-6 text-amber-400" />
                  <p className="text-amber-400 text-sm font-semibold uppercase tracking-wider">Your Ticket Number</p>
                  <Medal className="h-6 w-6 text-amber-400" />
                </div>
                <p className="text-5xl font-bold text-white font-mono">#{registrationNumber}</p>
              </div>
            )}

            <div className="p-6 space-y-6">
              {/* Registration ID */}
              <div className="bg-slate-50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Trophy className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="font-semibold text-slate-700">Registration ID</p>
                </div>
                <p className="text-lg font-mono text-blue-600 break-all">{registrationId}</p>
              </div>

              {/* Total Amount */}
              {total && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200">
                  <p className="text-sm text-emerald-700 font-medium mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-emerald-600">Rs. {parseFloat(total).toLocaleString()}</p>
                </div>
              )}

              {/* Cash Payment Section */}
              {method === 'cash' && slipId && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <QrCode className="h-5 w-5 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">Cash Payment Slip</h3>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <p className="text-sm text-slate-500 mb-1">Slip ID</p>
                    <p className="text-2xl font-mono font-bold text-amber-600">{slipId}</p>
                  </div>

                  {qrCode && (
                    <div className="flex flex-col items-center mb-4">
                      <div className="bg-white p-4 rounded-xl shadow-lg">
                        <img 
                          src={qrCode} 
                          alt="QR Code" 
                          className="w-48 h-48"
                          style={{ imageRendering: 'crisp-edges' }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-3 text-center">
                        Scan this QR code to verify your registration
                      </p>
                    </div>
                  )}

                  <div className="bg-orange-100 rounded-lg p-4 mb-4">
                    <p className="text-sm text-orange-800 font-medium flex items-start gap-2">
                      <span className="text-lg">⚠️</span>
                      <span>Bring this slip and pay at the FCIT Sports Society desk to complete your registration.</span>
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head><title>Cash Slip - ${slipId}</title></head>
                            <body style="font-family: system-ui, sans-serif; padding: 40px; text-align: center;">
                              <h1 style="color: #1e293b;">FCIT Sports Society</h1>
                              <h2 style="color: #f59e0b;">Mini Olympics 2026</h2>
                              <h3>Cash Payment Slip</h3>
                              <p style="font-size: 28px; font-weight: bold; margin: 30px 0; font-family: monospace; background: #fef3c7; padding: 20px; border-radius: 10px;">${slipId}</p>
                              <p>Registration ID: ${registrationId}</p>
                              <p>Ticket #${registrationNumber}</p>
                              <p style="margin-top: 40px; color: #666;">Please bring this slip to complete payment at the desk.</p>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }}
                    className="w-full h-12 border-2 border-amber-300 hover:bg-amber-50"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Print Slip
                  </Button>
                </div>
              )}

              {/* Online Payment Section */}
              {method === 'online' && slipId && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <QrCode className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">Online Payment Reference</h3>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <p className="text-sm text-slate-500 mb-1">Reference ID</p>
                    <p className="text-2xl font-mono font-bold text-blue-600">{slipId}</p>
                  </div>

                  {qrCode && (
                    <div className="flex flex-col items-center mb-4">
                      <div className="bg-white p-4 rounded-xl shadow-lg">
                        <img 
                          src={qrCode} 
                          alt="QR Code" 
                          className="w-48 h-48"
                          style={{ imageRendering: 'crisp-edges' }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-3 text-center">
                        Scan this QR code to verify your registration
                      </p>
                    </div>
                  )}

                  <div className="bg-blue-100 rounded-lg p-4">
                    <p className="text-sm text-blue-800 font-medium flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <span>Your payment is under verification. You will be notified once it's approved.</span>
                    </p>
                    {transactionId && (
                      <p className="text-sm text-blue-700 mt-2 ml-7">
                        Transaction ID: <span className="font-mono">{transactionId}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Group join section */}
              {registrationNumber && slipId && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">Join Your Sport Group(s)</h3>
                  </div>
                  
                  {groupLoading && (
                    <div className="text-center py-4">
                      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                      <p className="text-sm text-slate-600 mt-2">Loading group links...</p>
                    </div>
                  )}
                  
                  {!groupLoading && groupInfo.length === 0 && (
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-slate-600">
                        Group links are not configured yet. Please contact the event desk and share your ticket <span className="font-bold text-purple-600">#{registrationNumber}</span>.
                      </p>
                    </div>
                  )}
                  
                  {groupInfo.map((g) => (
                    <div key={g.gameName} className="bg-white rounded-xl p-4 mb-3 last:mb-0 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="h-4 w-4 text-purple-500" />
                        <span className="font-semibold text-slate-800">{g.groupTitle}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">Game: {g.gameName}</p>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {g.groupUrl && (
                          <button
                            onClick={() => {
                              // Copy message first, then open group
                              if (g.messageText) {
                                navigator.clipboard.writeText(g.messageText);
                              }
                              window.open(g.groupUrl, '_blank');
                              if (g.messageText) {
                                setTimeout(() => {
                                  alert('✅ Message copied!\n\nAfter joining the group, just PASTE (Ctrl+V) to introduce yourself.');
                                }, 500);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg text-sm font-medium transition-all shadow-md cursor-pointer"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Join Group (auto-copy message)
                          </button>
                        )}
                        {g.whatsappUrl && (
                          <a 
                            href={g.whatsappUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg text-sm font-medium transition-all shadow-md"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Message Coordinator
                          </a>
                        )}
                      </div>
                      
                      {/* Message preview */}
                      {g.messageText && (
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                          <p className="text-xs text-emerald-700 mb-2 font-medium">📋 This message will be copied when you join:</p>
                          <div className="text-sm text-slate-700 font-mono text-xs leading-relaxed bg-white p-2 rounded border italic">
                            {g.messageText}
                          </div>
                        </div>
                      )}
                      
                      {/* Coordinator info */}
                      {g.coordinatorName && (
                        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                          Coordinator: <span className="font-medium text-slate-700">{g.coordinatorName}</span>
                          {g.coordinatorPhone && <span> ({g.coordinatorPhone})</span>}
                        </div>
                      )}
                      
                      {!g.groupUrl && !g.whatsappUrl && (
                        <p className="text-sm text-slate-600 bg-amber-50 rounded-lg p-3 mt-2">
                          ⚠️ Contact the desk with your ticket <span className="font-bold">#{registrationNumber}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full h-12 border-2">
                    <Home className="h-5 w-5 mr-2" />
                    Home
                  </Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                    Register Another
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-emerald-700/60 text-sm mt-8">
          FCIT Sports Society • Mini Olympics 2026
        </p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 mt-4">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
