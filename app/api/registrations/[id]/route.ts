import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET - Get single registration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await sql`SELECT * FROM registrations WHERE id = ${params.id}`;
    const registration = result[0] || null;

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: registration });
  } catch (error: any) {
    console.error('Get registration error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update registration status (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const sessionToken = request.cookies.get('admin_session')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin authentication required' },
        { status: 401 }
      );
    }

    const session = await getAdminSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or expired session' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, discount } = body;

    // At least one field must be provided
    if (status === undefined && discount === undefined) {
      return NextResponse.json(
        { error: 'At least one field (status or discount) is required' },
        { status: 400 }
      );
    }

    // First, fetch the current registration to preserve existing data
    const currentResult = await sql`SELECT * FROM registrations WHERE id = ${params.id}`;
    if (!currentResult || currentResult.length === 0) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }
    const currentRegistration = currentResult[0];

    // Validate status value if provided
    if (status !== undefined) {
      const validStatuses = ['pending_cash', 'pending_online', 'paid', 'rejected'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        );
      }
    }

    // Validate discount if provided
    let discountValue: number | null = null;
    if (discount !== undefined && discount !== null) {
      discountValue = Number(discount);
      if (isNaN(discountValue) || discountValue < 0) {
        return NextResponse.json(
          { error: 'Invalid discount value. Must be a non-negative number.' },
          { status: 400 }
        );
      }
    }

    // Build dynamic UPDATE query based on what fields are provided
    // CRITICAL: Only update fields that are explicitly provided - preserve all other data
    const shouldUpdateStatus = status !== undefined ? status : null;
    const shouldUpdateDiscount = discount !== undefined && discount !== null ? discountValue : null;
    const financeInsertionId = uuidv4();
    const recordedBy = session.username || session.adminUserId || 'system';

    const result = await sql`
      WITH updated_registration AS (
        UPDATE registrations
        SET
          status = COALESCE(${shouldUpdateStatus}, status),
          discount = COALESCE(${shouldUpdateDiscount}, discount),
          updated_at = NOW()
        WHERE id = ${params.id}
        RETURNING *
      ),
      registration_summary AS (
        SELECT
          id,
          status,
          total_amount,
          COALESCE(discount, 0) AS discount,
          payment_method
        FROM updated_registration
      ),
      delete_income AS (
        DELETE FROM finance_records
        WHERE reference_type = 'registration'
          AND reference_id = ${params.id}
          AND record_type = 'income'
          AND EXISTS (
            SELECT 1 FROM registration_summary WHERE status IS DISTINCT FROM 'paid'
          )
      ),
      registration_income AS (
        INSERT INTO finance_records (
          id,
          record_type,
          category,
          amount,
          reference_id,
          reference_type,
          payment_method,
          recorded_by,
          record_date,
          created_at,
          updated_at
        )
        SELECT
          ${financeInsertionId},
          'income',
          'registration',
          total_amount - discount,
          id,
          'registration',
          payment_method,
          ${recordedBy},
          CURRENT_DATE,
          NOW(),
          NOW()
        FROM registration_summary
        WHERE status = 'paid'
        ON CONFLICT (reference_type, reference_id, record_type)
        DO UPDATE SET
          amount = EXCLUDED.amount,
          payment_method = EXCLUDED.payment_method,
          recorded_by = EXCLUDED.recorded_by,
          updated_at = NOW()
      )
      SELECT * FROM updated_registration;
    `;

    const updated = result?.[0] || null;

    if (!updated) {
      return NextResponse.json(
        { error: 'Registration not found after update' },
        { status: 404 }
      );
    }

    // Log the update for audit purposes
    console.log(`Registration ${params.id} updated:`, {
      previousStatus: currentRegistration.status,
      previousDiscount: currentRegistration.discount,
      status: status !== undefined ? status : 'unchanged',
      discount: discount !== undefined ? discountValue : 'unchanged',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update registration error:', error);
    return NextResponse.json(
      { error: 'Failed to update registration', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await sql`DELETE FROM registrations WHERE id = ${params.id}`;

    return NextResponse.json({ success: true, message: 'Registration deleted' });
  } catch (error: any) {
    console.error('Delete registration error:', error);
    return NextResponse.json(
      { error: 'Failed to delete registration', details: error.message },
      { status: 500 }
    );
  }
}
