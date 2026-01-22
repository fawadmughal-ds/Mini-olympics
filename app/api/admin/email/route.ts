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

// Create nodemailer transporter
async function createTransporter() {
  const settings = await getSmtpSettings();
  
  if (!settings.smtp_email || !settings.smtp_password) {
    throw new Error('SMTP settings not configured');
  }

  return nodemailer.createTransport({
    host: settings.smtp_host || 'smtp.gmail.com',
    port: parseInt(settings.smtp_port || '587'),
    secure: settings.smtp_port === '465',
    auth: {
      user: settings.smtp_email,
      pass: settings.smtp_password,
    },
  });
}

// POST - Send email
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { to, cc, bcc, subject, html, attachments } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'to, subject, and html are required' }, { status: 400 });
    }

    const settings = await getSmtpSettings();
    const transporter = await createTransporter();

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${settings.smtp_from_name || 'FCIT Sports Society'}" <${settings.smtp_email}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    };

    if (cc) {
      mailOptions.cc = Array.isArray(cc) ? cc.join(', ') : cc;
    }

    if (bcc) {
      mailOptions.bcc = Array.isArray(bcc) ? bcc.join(', ') : bcc;
    }

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected 
    });
  } catch (error: any) {
    console.error('Send email error:', error);
    return NextResponse.json({ 
      error: 'Failed to send email', 
      details: error.message 
    }, { status: 500 });
  }
}

// GET - Get recipients list based on filter
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const game = searchParams.get('game');
    const gender = searchParams.get('gender');

    let query = 'SELECT DISTINCT email, name, gender FROM registrations WHERE 1=1';
    const params: any[] = [];

    if (filter === 'paid') {
      query += ' AND status = $1';
      params.push('paid');
    } else if (filter === 'pending') {
      query += ' AND status IN ($1, $2)';
      params.push('pending_cash', 'pending_online');
    }

    if (gender && gender !== 'all') {
      query += ` AND gender = $${params.length + 1}`;
      params.push(gender);
    }

    if (game && game !== 'all') {
      query += ` AND selected_games LIKE $${params.length + 1}`;
      params.push(`%${game}%`);
    }

    // Use raw SQL for dynamic query
    let recipients;
    if (params.length === 0) {
      recipients = await sql`SELECT DISTINCT email, name, gender FROM registrations`;
    } else if (params.length === 1) {
      recipients = await sql`SELECT DISTINCT email, name, gender FROM registrations WHERE status = ${params[0]}`;
    } else if (filter === 'paid' && gender && gender !== 'all') {
      recipients = await sql`SELECT DISTINCT email, name, gender FROM registrations WHERE status = 'paid' AND gender = ${gender}`;
    } else if (filter === 'paid') {
      recipients = await sql`SELECT DISTINCT email, name, gender FROM registrations WHERE status = 'paid'`;
    } else {
      recipients = await sql`SELECT DISTINCT email, name, gender FROM registrations`;
    }

    return NextResponse.json({ success: true, data: recipients });
  } catch (error: any) {
    console.error('Get recipients error:', error);
    return NextResponse.json({ error: 'Failed to get recipients', details: error.message }, { status: 500 });
  }
}
