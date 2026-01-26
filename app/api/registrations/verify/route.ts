import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - Verify team name uniqueness
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamName } = body;

    if (!teamName || teamName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    // Check if team name already exists (case-insensitive)
    const existingTeam = await sql`
      SELECT id, team_name FROM registrations 
      WHERE LOWER(team_name) = LOWER(${teamName.trim()})
      LIMIT 1
    `;

    if (existingTeam && existingTeam.length > 0) {
      return NextResponse.json({
        success: true,
        isUnique: false,
        message: 'This team name is already taken. Please choose a different name.',
      });
    }

    return NextResponse.json({
      success: true,
      isUnique: true,
      message: 'Team name is available!',
    });
  } catch (error: any) {
    console.error('Team name verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify team name', details: error.message },
      { status: 500 }
    );
  }
}
