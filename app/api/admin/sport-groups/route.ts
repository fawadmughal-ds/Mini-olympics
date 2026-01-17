import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET - Fetch all sport groups
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super_admin and admin can view groups
    if (!['super_admin', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const groups = await sql`
      SELECT id, game_name, gender, group_title, group_url, coordinator_name, coordinator_phone, message_template, is_active, updated_at
      FROM sport_groups
      ORDER BY game_name ASC, gender ASC
    `;

    return NextResponse.json({ success: true, data: groups });
  } catch (error: any) {
    console.error('Fetch sport groups error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sport groups', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new sport group
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super_admin can create groups
    if (session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { gameName, gender, groupTitle, groupUrl, coordinatorName, coordinatorPhone, messageTemplate, isActive } = body;

    if (!gameName) {
      return NextResponse.json({ error: 'Game name is required' }, { status: 400 });
    }

    const genderValue = gender || 'boys';
    if (!['boys', 'girls'].includes(genderValue)) {
      return NextResponse.json({ error: 'Gender must be boys or girls' }, { status: 400 });
    }

    const id = uuidv4();

    await sql`
      INSERT INTO sport_groups (id, game_name, gender, group_title, group_url, coordinator_name, coordinator_phone, message_template, is_active, updated_at)
      VALUES (${id}, ${gameName}, ${genderValue}, ${groupTitle || gameName}, ${groupUrl || null}, ${coordinatorName || null}, ${coordinatorPhone || null}, ${messageTemplate || null}, ${isActive !== false}, NOW())
      ON CONFLICT (game_name, gender) DO UPDATE SET
        group_title = EXCLUDED.group_title,
        group_url = EXCLUDED.group_url,
        coordinator_name = EXCLUDED.coordinator_name,
        coordinator_phone = EXCLUDED.coordinator_phone,
        message_template = EXCLUDED.message_template,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `;

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Create sport group error:', error);
    return NextResponse.json(
      { error: 'Failed to create sport group', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update a sport group
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super_admin can update groups
    if (session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { id, gameName, gender, groupTitle, groupUrl, coordinatorName, coordinatorPhone, messageTemplate, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await sql`
      UPDATE sport_groups
      SET 
        game_name = COALESCE(${gameName}, game_name),
        gender = COALESCE(${gender}, gender),
        group_title = ${groupTitle || null},
        group_url = ${groupUrl || null},
        coordinator_name = ${coordinatorName || null},
        coordinator_phone = ${coordinatorPhone || null},
        message_template = ${messageTemplate || null},
        is_active = ${isActive !== false},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update sport group error:', error);
    return NextResponse.json(
      { error: 'Failed to update sport group', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a sport group
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super_admin can delete groups
    if (session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await sql`DELETE FROM sport_groups WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete sport group error:', error);
    return NextResponse.json(
      { error: 'Failed to delete sport group', details: error.message },
      { status: 500 }
    );
  }
}
