import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET - Fetch all finance records
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const recordType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = `
      SELECT r.*, 
        COALESCE(
          (SELECT json_agg(json_build_object('id', a.id, 'file_url', a.file_url, 'file_name', a.file_name))
           FROM finance_attachments a WHERE a.record_id = r.id), '[]'
        ) as attachments
      FROM finance_records r
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];

    if (recordType) {
      params.push(recordType);
      conditions.push(`r.record_type = $${params.length}`);
    }
    if (startDate) {
      params.push(startDate);
      conditions.push(`r.record_date >= $${params.length}`);
    }
    if (endDate) {
      params.push(endDate);
      conditions.push(`r.record_date <= $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY r.record_date DESC, r.created_at DESC';

    const records = await sql(query, params);

    // Calculate summary
    const allRecords = await sql`
      SELECT record_type, SUM(amount) as total
      FROM finance_records
      GROUP BY record_type
    `;

    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
    };

    (allRecords as any[]).forEach((r: any) => {
      if (r.record_type === 'income') summary.totalIncome = Number(r.total);
      if (r.record_type === 'expense') summary.totalExpense = Number(r.total);
    });
    summary.balance = summary.totalIncome - summary.totalExpense;

    return NextResponse.json({ success: true, data: records, summary });
  } catch (error: any) {
    console.error('Fetch finance records error:', error);
    return NextResponse.json({ error: 'Failed to fetch records', details: error.message }, { status: 500 });
  }
}

// POST - Create a new finance record
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

    const body = await request.json();
    const { recordType, category, amount, description, referenceId, referenceType, paymentMethod, recordDate, attachments } = body;

    if (!recordType || !category || amount === undefined) {
      return NextResponse.json({ error: 'Record type, category, and amount are required' }, { status: 400 });
    }

    const id = uuidv4();

    await sql`
      INSERT INTO finance_records (id, record_type, category, amount, description, reference_id, reference_type, payment_method, recorded_by, record_date, created_at, updated_at)
      VALUES (${id}, ${recordType}, ${category}, ${Number(amount)}, ${description || null}, ${referenceId || null}, ${referenceType || null}, ${paymentMethod || null}, ${session.username}, ${recordDate || new Date().toISOString().split('T')[0]}, NOW(), NOW())
    `;

    // Add attachments if provided
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.fileUrl) {
          await sql`
            INSERT INTO finance_attachments (id, record_id, file_url, file_name, file_type, uploaded_by, created_at)
            VALUES (${uuidv4()}, ${id}, ${att.fileUrl}, ${att.fileName || null}, ${att.fileType || null}, ${session.username}, NOW())
          `;
        }
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Create finance record error:', error);
    return NextResponse.json({ error: 'Failed to create record', details: error.message }, { status: 500 });
  }
}

// PUT - Update a finance record
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { id, recordType, category, amount, description, referenceId, referenceType, paymentMethod, recordDate } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await sql`
      UPDATE finance_records
      SET 
        record_type = COALESCE(${recordType}, record_type),
        category = COALESCE(${category}, category),
        amount = COALESCE(${amount !== undefined ? Number(amount) : null}, amount),
        description = ${description ?? null},
        reference_id = ${referenceId ?? null},
        reference_type = ${referenceType ?? null},
        payment_method = ${paymentMethod ?? null},
        record_date = COALESCE(${recordDate}, record_date),
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update finance record error:', error);
    return NextResponse.json({ error: 'Failed to update record', details: error.message }, { status: 500 });
  }
}

// DELETE - Delete a finance record
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await sql`DELETE FROM finance_records WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete finance record error:', error);
    return NextResponse.json({ error: 'Failed to delete record', details: error.message }, { status: 500 });
  }
}
