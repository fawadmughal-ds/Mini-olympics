import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Public (ticket-holder) endpoint: requires BOTH id + slipId so random guessing is harder.
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id') || '';
    const slipId = searchParams.get('slipId') || '';

    if (!id || !slipId) {
      return NextResponse.json({ error: 'id and slipId are required' }, { status: 400 });
    }

    const result = await sql`
      SELECT id, registration_number, slip_id, name, roll_number, contact_number, gender, team_name, selected_games, payment_method, status
      FROM registrations
      WHERE id = ${id} AND slip_id = ${slipId}
      LIMIT 1
    `;

    const row: any = result?.[0] || null;
    if (!row) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    let selectedGames: string[] = [];
    try {
      selectedGames = typeof row.selected_games === 'string' ? JSON.parse(row.selected_games) : row.selected_games;
      if (!Array.isArray(selectedGames)) selectedGames = [];
    } catch {
      selectedGames = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        id: row.id,
        registrationNumber: row.registration_number,
        slipId: row.slip_id,
        name: row.name,
        rollNumber: row.roll_number,
        contactNumber: row.contact_number,
        gender: row.gender || 'boys',
        teamName: row.team_name || '',
        selectedGames,
        paymentMethod: row.payment_method,
        status: row.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch registration', details: error.message },
      { status: 500 }
    );
  }
}

