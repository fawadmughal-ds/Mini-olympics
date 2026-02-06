import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET - Fetch all loans
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['super_admin', 'inventory_admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const itemId = searchParams.get('itemId');

    let query = `
      SELECT l.*, i.name as item_name, i.category as item_category
      FROM inventory_loans l
      JOIN inventory_items i ON l.item_id = i.id
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      params.push(status);
      conditions.push(`l.status = $${params.length}`);
    }
    if (itemId) {
      params.push(itemId);
      conditions.push(`l.item_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY l.created_at DESC';

    const loans = await sql(query, params);

    return NextResponse.json({ success: true, data: loans });
  } catch (error: any) {
    console.error('Fetch loans error:', error);
    return NextResponse.json({ error: 'Failed to fetch loans', details: error.message }, { status: 500 });
  }
}

// POST - Create a new loan
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['super_admin', 'inventory_admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { itemId, borrowerName, borrowerRoll, borrowerPhone, quantity, expectedReturnDate, notes } = body;

    if (!itemId || !borrowerName || !borrowerPhone) {
      return NextResponse.json({ error: 'Item ID, borrower name, and phone are required' }, { status: 400 });
    }

    const loanQty = Number(quantity) || 1;

    // Check available stock
    const item = await sql`SELECT quantity FROM inventory_items WHERE id = ${itemId}`;
    if ((item as any[]).length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const totalQty = (item as any[])[0].quantity;
    
    // Get current loaned quantity
    const loanedResult = await sql`SELECT COALESCE(SUM(quantity), 0) as loaned FROM inventory_loans WHERE item_id = ${itemId} AND status = 'active'`;
    const currentLoaned = Number((loanedResult as any[])[0]?.loaned) || 0;
    const availableQty = totalQty - currentLoaned;
    
    if (availableQty < loanQty) {
      return NextResponse.json({ error: `Insufficient stock. Available: ${availableQty}` }, { status: 400 });
    }

    const id = uuidv4();

    // Create loan record (don't reduce inventory quantity - just track the loan)
    await sql`
      INSERT INTO inventory_loans (id, item_id, borrower_name, borrower_roll, borrower_phone, quantity, expected_return_date, notes, loaned_by, created_at, updated_at)
      VALUES (${id}, ${itemId}, ${borrowerName}, ${borrowerRoll || null}, ${borrowerPhone}, ${loanQty}, ${expectedReturnDate || null}, ${notes || null}, ${session.username}, NOW(), NOW())
    `;

    // Log movement (for tracking purposes only)
    await sql`
      INSERT INTO inventory_movements (id, item_id, movement_type, quantity, previous_quantity, new_quantity, reason, performed_by, created_at)
      VALUES (${uuidv4()}, ${itemId}, 'loan', ${loanQty}, ${availableQty}, ${availableQty - loanQty}, ${'Loaned to ' + borrowerName}, ${session.username}, NOW())
    `;

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Create loan error:', error);
    return NextResponse.json({ error: 'Failed to create loan', details: error.message }, { status: 500 });
  }
}

// PUT - Return a loan
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['super_admin', 'inventory_admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status: newStatus, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Loan ID is required' }, { status: 400 });
    }

    // Get loan details
    const loan = await sql`SELECT * FROM inventory_loans WHERE id = ${id}`;
    if ((loan as any[]).length === 0) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    const loanData = (loan as any[])[0];

    if (loanData.status !== 'active') {
      return NextResponse.json({ error: 'Loan is not active' }, { status: 400 });
    }

    // Update loan status
    await sql`
      UPDATE inventory_loans
      SET status = ${newStatus || 'returned'}, 
          actual_return_date = ${newStatus === 'returned' ? 'NOW()' : null}::timestamp,
          returned_to = ${newStatus === 'returned' ? session.username : null},
          notes = COALESCE(${notes}, notes),
          updated_at = NOW()
      WHERE id = ${id}
    `;

    // If returned, just log the movement (quantity tracking is automatic via loan status)
    if (newStatus === 'returned') {
      // Log movement for tracking
      await sql`
        INSERT INTO inventory_movements (id, item_id, movement_type, quantity, previous_quantity, new_quantity, reason, performed_by, created_at)
        VALUES (${uuidv4()}, ${loanData.item_id}, 'return', ${loanData.quantity}, 0, 0, ${'Returned by ' + loanData.borrower_name}, ${session.username}, NOW())
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update loan error:', error);
    return NextResponse.json({ error: 'Failed to update loan', details: error.message }, { status: 500 });
  }
}
