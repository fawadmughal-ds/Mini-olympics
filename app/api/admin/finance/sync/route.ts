import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// POST - Sync existing paid registrations to finance records
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['super_admin', 'finance_admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all paid registrations that don't have a finance record
    const paidRegistrations = await sql`
      SELECT r.* 
      FROM registrations r
      LEFT JOIN finance_records f ON f.reference_id = r.id AND f.reference_type = 'registration'
      WHERE r.status = 'paid' AND f.id IS NULL
    `;

    let syncedCount = 0;
    const errors: string[] = [];

    for (const reg of paidRegistrations as any[]) {
      try {
        const financeId = uuidv4();
        const finalAmount = Number(reg.total_amount) - (Number(reg.discount) || 0);
        const paymentMethod = reg.payment_method === 'cash' ? 'cash' : 'bank_transfer';
        const recordDate = reg.created_at ? new Date(reg.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        await sql`
          INSERT INTO finance_records (
            id, record_type, category, amount, description, 
            reference_id, reference_type, payment_method, recorded_by, 
            record_date, created_at, updated_at
          ) VALUES (
            ${financeId}, 'income', 'registration', ${finalAmount}, 
            ${'Registration #' + reg.registration_number + ' - ' + reg.name},
            ${reg.id}, 'registration', ${paymentMethod}, 'sync',
            ${recordDate}, NOW(), NOW()
          )
        `;
        syncedCount++;
      } catch (err: any) {
        errors.push(`Registration ${reg.registration_number}: ${err.message}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      synced: syncedCount, 
      total: paidRegistrations.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Sync finance records error:', error);
    return NextResponse.json({ error: 'Failed to sync records', details: error.message }, { status: 500 });
  }
}
