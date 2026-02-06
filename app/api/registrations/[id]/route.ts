import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
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

    // Verify session in database
    const sessionResult = await sql`
      SELECT * FROM admin_sessions 
      WHERE session_token = ${sessionToken} AND expires_at > NOW()
    `;
    
    if (!sessionResult || sessionResult.length === 0) {
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
    if (status !== undefined && discount !== undefined) {
      // Update both status and discount
      await sql`
        UPDATE registrations
        SET status = ${status}, 
            discount = ${discountValue},
            updated_at = NOW()
        WHERE id = ${params.id}
      `;
    } else if (status !== undefined) {
      // Update only status - DO NOT touch discount or any other fields
      await sql`
        UPDATE registrations
        SET status = ${status}, 
            updated_at = NOW()
        WHERE id = ${params.id}
      `;
    } else if (discount !== undefined) {
      // Update only discount - DO NOT touch status or any other fields
      await sql`
        UPDATE registrations
        SET discount = ${discountValue},
            updated_at = NOW()
        WHERE id = ${params.id}
      `;
    }

    // Fetch updated registration to verify the update
    const result = await sql`SELECT * FROM registrations WHERE id = ${params.id}`;
    const updated = result[0] || null;

    if (!updated) {
      return NextResponse.json(
        { error: 'Registration not found after update' },
        { status: 404 }
      );
    }

    // If status changed to 'paid' and it wasn't already paid, create a finance record
    if (status === 'paid' && currentRegistration.status !== 'paid') {
      try {
        const financeId = uuidv4();
        const finalAmount = Number(updated.total_amount) - (Number(updated.discount) || 0);
        const paymentMethod = updated.payment_method === 'cash' ? 'cash' : 'bank_transfer';
        
        // Check if finance record already exists for this registration
        const existingFinance = await sql`
          SELECT id FROM finance_records 
          WHERE reference_id = ${params.id} AND reference_type = 'registration'
        `;
        
        if (!existingFinance || existingFinance.length === 0) {
          await sql`
            INSERT INTO finance_records (
              id, record_type, category, amount, description, 
              reference_id, reference_type, payment_method, recorded_by, 
              record_date, created_at, updated_at
            ) VALUES (
              ${financeId}, 'income', 'registration', ${finalAmount}, 
              ${'Registration #' + updated.registration_number + ' - ' + updated.name},
              ${params.id}, 'registration', ${paymentMethod}, 'system',
              ${new Date().toISOString().split('T')[0]}, NOW(), NOW()
            )
          `;
          console.log(`Finance record created for registration ${params.id}, amount: ${finalAmount}`);
        }
      } catch (financeError: any) {
        // Log but don't fail the update if finance record creation fails
        console.error('Failed to create finance record:', financeError.message);
      }
    }

    // Log the update for audit purposes
    console.log(`Registration ${params.id} updated:`, {
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

