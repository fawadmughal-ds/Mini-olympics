import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET - Fetch all games pricing
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const games = await sql`
      SELECT id, game_name, gender, price, players, created_at
      FROM games_pricing
      ORDER BY game_name ASC, gender ASC
    `;

    return NextResponse.json({ success: true, data: games });
  } catch (error: any) {
    console.error('Fetch games error:', error);
    return NextResponse.json({ error: 'Failed to fetch games', details: error.message }, { status: 500 });
  }
}

// POST - Add or update game pricing
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { game_name, gender, price, players } = body;

    if (!game_name || !gender || price === undefined) {
      return NextResponse.json({ error: 'game_name, gender, and price are required' }, { status: 400 });
    }

    // Upsert - insert or update on conflict
    await sql`
      INSERT INTO games_pricing (game_name, gender, price, players, created_at)
      VALUES (${game_name}, ${gender}, ${price}, ${players || null}, NOW())
      ON CONFLICT (game_name, gender) DO UPDATE SET 
        price = ${price},
        players = ${players || null}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Add/update game error:', error);
    return NextResponse.json({ error: 'Failed to save game', details: error.message }, { status: 500 });
  }
}

// DELETE - Remove game pricing
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const game_name = searchParams.get('game_name');
    const gender = searchParams.get('gender');

    if (id) {
      await sql`DELETE FROM games_pricing WHERE id = ${parseInt(id)}`;
    } else if (game_name && gender) {
      await sql`DELETE FROM games_pricing WHERE game_name = ${game_name} AND gender = ${gender}`;
    } else {
      return NextResponse.json({ error: 'id or (game_name + gender) required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete game error:', error);
    return NextResponse.json({ error: 'Failed to delete game', details: error.message }, { status: 500 });
  }
}
