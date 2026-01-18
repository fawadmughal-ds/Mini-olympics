import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET - Fetch all inventory items
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

    const items = await sql`
      SELECT * FROM inventory_items
      ORDER BY category, name ASC
    `;

    // Get loan counts for each item
    const loans = await sql`
      SELECT item_id, COUNT(*) as active_loans, SUM(quantity) as loaned_qty
      FROM inventory_loans
      WHERE status = 'active'
      GROUP BY item_id
    `;

    const loanMap = new Map((loans as any[]).map((l: any) => [l.item_id, { activeLoans: Number(l.active_loans), loanedQty: Number(l.loaned_qty) }]));

    const itemsWithLoans = (items as any[]).map((item: any) => ({
      ...item,
      activeLoans: loanMap.get(item.id)?.activeLoans || 0,
      loanedQty: loanMap.get(item.id)?.loanedQty || 0,
    }));

    return NextResponse.json({ success: true, data: itemsWithLoans });
  } catch (error: any) {
    console.error('Fetch inventory error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory', details: error.message }, { status: 500 });
  }
}

// POST - Create a new inventory item
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
    const { name, description, category, quantity, unit, minQuantity, location } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const id = uuidv4();
    const qty = Number(quantity) || 0;

    await sql`
      INSERT INTO inventory_items (id, name, description, category, quantity, unit, min_quantity, location, created_at, updated_at)
      VALUES (${id}, ${name}, ${description || null}, ${category || 'general'}, ${qty}, ${unit || 'pcs'}, ${Number(minQuantity) || 0}, ${location || null}, NOW(), NOW())
    `;

    // Log the initial stock as a movement
    if (qty > 0) {
      await sql`
        INSERT INTO inventory_movements (id, item_id, movement_type, quantity, previous_quantity, new_quantity, reason, performed_by, created_at)
        VALUES (${uuidv4()}, ${id}, 'add', ${qty}, 0, ${qty}, 'Initial stock', ${session.username}, NOW())
      `;
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Create inventory item error:', error);
    return NextResponse.json({ error: 'Failed to create item', details: error.message }, { status: 500 });
  }
}

// PUT - Update an inventory item
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
    const { id, name, description, category, quantity, unit, minQuantity, location, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Get current quantity for movement logging
    const current = await sql`SELECT quantity FROM inventory_items WHERE id = ${id}`;
    const currentQty = (current as any[])[0]?.quantity || 0;
    const newQty = quantity !== undefined ? Number(quantity) : currentQty;

    await sql`
      UPDATE inventory_items
      SET 
        name = COALESCE(${name}, name),
        description = ${description ?? null},
        category = COALESCE(${category}, category),
        quantity = ${newQty},
        unit = COALESCE(${unit}, unit),
        min_quantity = COALESCE(${minQuantity !== undefined ? Number(minQuantity) : null}, min_quantity),
        location = ${location ?? null},
        is_active = COALESCE(${isActive}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
    `;

    // Log quantity change as movement
    if (quantity !== undefined && newQty !== currentQty) {
      const diff = newQty - currentQty;
      await sql`
        INSERT INTO inventory_movements (id, item_id, movement_type, quantity, previous_quantity, new_quantity, reason, performed_by, created_at)
        VALUES (${uuidv4()}, ${id}, 'adjust', ${Math.abs(diff)}, ${currentQty}, ${newQty}, ${diff > 0 ? 'Stock adjustment (added)' : 'Stock adjustment (removed)'}, ${session.username}, NOW())
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update inventory item error:', error);
    return NextResponse.json({ error: 'Failed to update item', details: error.message }, { status: 500 });
  }
}

// DELETE - Delete an inventory item
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Check for active loans
    const activeLoans = await sql`SELECT COUNT(*) as count FROM inventory_loans WHERE item_id = ${id} AND status = 'active'`;
    if ((activeLoans as any[])[0]?.count > 0) {
      return NextResponse.json({ error: 'Cannot delete item with active loans' }, { status: 400 });
    }

    await sql`DELETE FROM inventory_items WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete inventory item error:', error);
    return NextResponse.json({ error: 'Failed to delete item', details: error.message }, { status: 500 });
  }
}
