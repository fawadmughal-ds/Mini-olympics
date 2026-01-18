import { sql } from '@/lib/db';

export type AdminRole = 'super_admin' | 'admin' | 'inventory_admin' | 'finance_admin';

export type AdminSession = {
  sessionToken: string;
  adminUserId: string | null;
  username: string | null;
  role: AdminRole;
  expiresAt: string | null;
};

/**
 * Get admin session by session token string
 */
export async function getAdminSession(sessionToken: string | undefined): Promise<AdminSession | null> {
  if (!sessionToken) return null;

  // Join admin_sessions -> admin_users when possible.
  // IMPORTANT: Some databases may still be on the legacy schema without admin_user_id/role.
  // In that case, this query fails with "column does not exist", so we fall back.
  let result: any[] | null = null;
  try {
    result = await sql`
      SELECT 
        s.session_token,
        s.expires_at,
        COALESCE(s.admin_user_id, NULL) AS admin_user_id,
        COALESCE(u.username, NULL) AS username,
        COALESCE(s.role, u.role, 'admin') AS role
      FROM admin_sessions s
      LEFT JOIN admin_users u ON u.id = s.admin_user_id
      WHERE s.session_token = ${sessionToken} AND s.expires_at > NOW()
      LIMIT 1
    `;
  } catch (err: any) {
    const code = err?.code ? String(err.code) : '';
    // 42703 = undefined_column
    if (code !== '42703') throw err;

    // Legacy fallback (no user linkage/role available)
    result = await sql`
      SELECT session_token, expires_at
      FROM admin_sessions
      WHERE session_token = ${sessionToken} AND expires_at > NOW()
      LIMIT 1
    `;
  }

  const row: any = result?.[0] || null;
  if (!row) return null;

  return {
    sessionToken: row.session_token,
    expiresAt: row.expires_at ? String(row.expires_at) : null,
    adminUserId: row.admin_user_id ? String(row.admin_user_id) : null,
    username: row.username ? String(row.username) : null,
    role: (row.role ? String(row.role) : 'admin') as AdminRole,
  };
}

export function hasAnyRole(session: AdminSession | null, allowed: AdminRole[]) {
  if (!session?.role) return false;
  if (session.role === 'super_admin') return true;
  return allowed.includes(session.role);
}
