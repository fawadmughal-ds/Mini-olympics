import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const runtime = 'nodejs';

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt.toString('base64')}:${derivedKey.toString('base64')}`;
}

function verifyPassword(password: string, stored: string) {
  // Legacy/plaintext compatibility (in case someone manually inserted a row)
  if (!stored.startsWith('scrypt:')) {
    return password === stored;
  }

  const parts = stored.split(':');
  if (parts.length !== 3) return false;
  const salt = Buffer.from(parts[1], 'base64');
  const expected = Buffer.from(parts[2], 'base64');
  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawUsername = body?.username;
    const rawPassword = body?.password;
    const username = typeof rawUsername === 'string' ? rawUsername.trim() : '';
    const password = typeof rawPassword === 'string' ? rawPassword : '';

    // Validate credentials (in production, use proper authentication)
    const isProd = process.env.NODE_ENV === 'production';
    const adminUsername = process.env.ADMIN_USERNAME || (isProd ? '' : 'admin');
    const adminPassword = process.env.ADMIN_PASSWORD || (isProd ? '' : 'admin@fcit2025');

    if (!adminUsername || !adminPassword) {
      return NextResponse.json(
        { error: 'Admin credentials not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD.' },
        { status: 500 }
      );
    }

    // If DB schema isn't initialized (missing sessions table), login will never work.
    const sessionsTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'admin_sessions'
      ) AS exists
    `;
    const sessionsTableExists = Boolean((sessionsTableCheck as any)[0]?.exists);
    if (!sessionsTableExists) {
      return NextResponse.json(
        {
          error: 'Database is not initialized (admin_sessions table is missing).',
          fix: 'Run ./scripts/db.sh init (or ./scripts/db.sh migrate) against the same DATABASE_URL.',
        },
        { status: 500 }
      );
    }

    // If the provided credentials match env/defaults, allow login and keep DB user in sync.
    // This avoids "Invalid credentials" when the admin_users row exists but has an old password hash.
    const isEnvAdminLogin = username === adminUsername && password === adminPassword;

    // Prefer DB-backed admin users if the table exists. If empty, bootstrap the default admin.
    const adminUsersTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'admin_users'
      ) AS exists
    `;

    const adminUsersTableExists = Boolean((adminUsersTableCheck as any)[0]?.exists);

    if (adminUsersTableExists) {
      if (isEnvAdminLogin) {
        await sql`
          INSERT INTO admin_users (id, username, password_hash)
          VALUES (${uuidv4()}, ${adminUsername}, ${hashPassword(adminPassword)})
          ON CONFLICT (username) DO UPDATE
          SET password_hash = EXCLUDED.password_hash,
              updated_at = NOW()
        `;
      }

      const countRes = await sql`SELECT COUNT(*)::int AS count FROM admin_users`;
      const count = Number((countRes as any)[0]?.count) || 0;

      if (count === 0) {
        // Create initial admin user from env/defaults
        await sql`
          INSERT INTO admin_users (id, username, password_hash)
          VALUES (${uuidv4()}, ${adminUsername}, ${hashPassword(adminPassword)})
        `;
      }

      const userRes = await sql`SELECT * FROM admin_users WHERE username = ${username} LIMIT 1`;
      const user = (userRes as any)[0] || null;

      if (isEnvAdminLogin) {
        // Always accept env admin login (even if DB verification fails due to mismatch).
      } else
      if (!user || !verifyPassword(password, user.password_hash)) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      // If we authenticated via DB user, attach it to the session.
      // If we authenticated via env-admin and the row doesn't exist yet, try to fetch it.
      const adminUserId = user?.id ? String(user.id) : null;
      const role = user?.role ? String(user.role) : null;
    } else {
      // Fallback: env/default credentials (for setups without admin_users table)
      if (username !== adminUsername || password !== adminPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    }

    // Create session token
    const sessionToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

    // Store session in database
    // Newer schema supports admin_user_id + role. Older schema will ignore missing columns by failing,
    // so we fall back to the legacy insert.
    try {
      const userRow = await sql`SELECT id, role FROM admin_users WHERE username = ${username} LIMIT 1`;
      const u = (userRow as any)[0] || null;
      await sql`
        INSERT INTO admin_sessions (id, session_token, expires_at, admin_user_id, role)
        VALUES (${uuidv4()}, ${sessionToken}, ${expiresAt.toISOString()}, ${u?.id || null}, ${u?.role || null})
      `;
    } catch {
      await sql`
        INSERT INTO admin_sessions (id, session_token, expires_at)
        VALUES (${uuidv4()}, ${sessionToken}, ${expiresAt.toISOString()})
      `;
    }

    // Get user role for redirect
    let userRole = 'super_admin';
    try {
      const userRow = await sql`SELECT role FROM admin_users WHERE username = ${username} LIMIT 1`;
      userRole = (userRow as any)[0]?.role || 'super_admin';
    } catch {}

    // Define default redirect page based on role
    const roleDefaultPage: Record<string, string> = {
      super_admin: '/admin/dashboard',
      registration_admin: '/admin/registrations',
      inventory_admin: '/admin/inventory',
      hoc_admin: '/admin/hoc',
    };

    const redirectTo = roleDefaultPage[userRole] || '/admin/dashboard';

    // Set cookie in response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      sessionToken,
      role: userRole,
      redirectTo,
    });
    
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
    });
    
    return response;

  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 500 }
    );
  }
}

