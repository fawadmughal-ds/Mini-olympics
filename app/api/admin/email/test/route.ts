import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

// Get SMTP settings from database
async function getSmtpSettings() {
  const settings = await sql`SELECT key, value FROM system_settings WHERE key LIKE 'smtp_%'`;
  const settingsMap: Record<string, string> = {};
  (settings as any[]).forEach((s: any) => {
    settingsMap[s.key] = s.value;
  });
  return settingsMap;
}

// POST - Send test email
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { to } = body;

    const settings = await getSmtpSettings();
    
    if (!settings.smtp_email || !settings.smtp_password) {
      return NextResponse.json({ error: 'SMTP settings not configured. Please save SMTP settings first.' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtp_host || 'smtp.gmail.com',
      port: parseInt(settings.smtp_port || '587'),
      secure: settings.smtp_port === '465',
      auth: {
        user: settings.smtp_email,
        pass: settings.smtp_password,
      },
    });

    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 16px; padding: 40px; text-align: center; color: white;">
            <div style="font-size: 48px; margin-bottom: 16px;">🏆</div>
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">FCIT Sports Society</h1>
            <p style="margin: 0; opacity: 0.9;">Mini Olympics 2026</p>
          </div>
          
          <div style="background: white; border-radius: 16px; padding: 32px; margin-top: 24px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px;">✅ Email Configuration Successful!</h2>
            <p style="margin: 0 0 16px 0; color: #64748b; line-height: 1.6;">
              This is a test email from your Mini Olympics admin dashboard. If you're reading this, your SMTP configuration is working correctly!
            </p>
            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin-top: 16px;">
              <p style="margin: 0; color: #166534; font-size: 14px;">
                <strong>Configuration:</strong><br>
                SMTP Server: ${settings.smtp_host || 'smtp.gmail.com'}<br>
                Port: ${settings.smtp_port || '587'}<br>
                From: ${settings.smtp_from_name || 'FCIT Sports Society'}
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
            <p>© 2026 FCIT Sports Society. All rights reserved.</p>
            <p><a href="https://pucit.edu.pk" style="color: #3b82f6; text-decoration: none;">pucit.edu.pk</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"${settings.smtp_from_name || 'FCIT Sports Society'}" <${settings.smtp_email}>`,
      to: to || settings.smtp_email,
      subject: '✅ Test Email - Mini Olympics Admin',
      html: testHtml,
    });

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Test email sent successfully!'
    });
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json({ 
      error: 'Failed to send test email', 
      details: error.message 
    }, { status: 500 });
  }
}
