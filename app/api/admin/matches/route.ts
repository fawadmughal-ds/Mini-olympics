import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// GET - Fetch match schedules and teams
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const game = searchParams.get('game');
    const gender = searchParams.get('gender');

    // Get teams (verified registrations with team names)
    let teamsQuery = `
      SELECT DISTINCT team_name, name, gender, selected_games
      FROM registrations
      WHERE status = 'paid' AND team_name IS NOT NULL AND team_name != ''
    `;
    const teamsParams: any[] = [];
    
    if (gender) {
      teamsParams.push(gender);
      teamsQuery += ` AND gender = $${teamsParams.length}`;
    }
    
    teamsQuery += ' ORDER BY team_name ASC';
    
    const teams = await sql(teamsQuery, teamsParams);

    // Get existing schedules
    let schedulesQuery = 'SELECT * FROM match_schedules';
    const schedulesParams: any[] = [];
    const schedulesConditions: string[] = [];
    
    if (game) {
      schedulesParams.push(game);
      schedulesConditions.push(`game_name = $${schedulesParams.length}`);
    }
    if (gender) {
      schedulesParams.push(gender);
      schedulesConditions.push(`gender = $${schedulesParams.length}`);
    }
    
    if (schedulesConditions.length > 0) {
      schedulesQuery += ' WHERE ' + schedulesConditions.join(' AND ');
    }
    schedulesQuery += ' ORDER BY created_at DESC';
    
    const schedules = await sql(schedulesQuery, schedulesParams);

    return NextResponse.json({ 
      success: true, 
      teams: teams,
      schedules: schedules
    });
  } catch (error: any) {
    console.error('Fetch matches error:', error);
    return NextResponse.json({ error: 'Failed to fetch data', details: error.message }, { status: 500 });
  }
}

// POST - Generate matches using AI
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['super_admin', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { game, gender, teams, customPrompt } = body;

    if (!game || !gender || !teams || !Array.isArray(teams) || teams.length < 2) {
      return NextResponse.json({ error: 'Game, gender, and at least 2 teams are required' }, { status: 400 });
    }

    if (!customPrompt || !customPrompt.trim()) {
      return NextResponse.json({ error: 'Please provide scheduling instructions' }, { status: 400 });
    }

    // Get API key from settings
    const apiKeyResult = await sql`SELECT value FROM system_settings WHERE key = 'openai_api_key'`;
    const apiKey = (apiKeyResult as any[])[0]?.value;

    if (!apiKey) {
      return NextResponse.json({ error: 'AI API key not configured. Go to Settings to add it.' }, { status: 400 });
    }

    // Generate matches using OpenAI with custom prompt
    const prompt = `Generate a tournament match schedule for ${game} (${gender}).

Teams (${teams.length} total): ${teams.join(', ')}

USER INSTRUCTIONS: "${customPrompt}"

IMPORTANT: Follow the user's instructions EXACTLY. If they ask for groups, create groups. If they ask for specific number of matches per team, ensure each team plays that many matches.

Return ONLY valid JSON in this format:
{
  "format": "group-stage" or "round-robin" or "knockout" or "custom",
  "groups": [
    {
      "name": "Group A",
      "teams": ["Team1", "Team2", "Team3"]
    }
  ],
  "rounds": [
    {
      "round": 1,
      "name": "Group A - Round 1" or "Quarter Finals" etc,
      "matches": [
        { "match": 1, "team1": "Team A", "team2": "Team B", "time": "TBD", "venue": "TBD" }
      ]
    }
  ],
  "notes": "Summary of the format used based on user instructions"
}

Make sure to include the groups array if creating a group-stage format. Ensure the schedule is fair and follows the user's instructions.`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a sports tournament scheduler. Generate fair match schedules. Only respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json();
      console.error('OpenAI error:', errorData);
      return NextResponse.json({ error: 'AI generation failed', details: errorData.error?.message || 'Unknown error' }, { status: 500 });
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices?.[0]?.message?.content;

    if (!generatedContent) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Parse the JSON response
    let scheduleData;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        scheduleData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      return NextResponse.json({ error: 'Failed to parse AI response', rawResponse: generatedContent }, { status: 500 });
    }

    // Save the schedule
    const id = uuidv4();
    await sql`
      INSERT INTO match_schedules (id, game_name, gender, schedule_data, generated_by, created_at, updated_at)
      VALUES (${id}, ${game}, ${gender}, ${JSON.stringify(scheduleData)}, ${session.username}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET schedule_data = ${JSON.stringify(scheduleData)}, updated_at = NOW()
    `;

    return NextResponse.json({ 
      success: true, 
      id,
      schedule: scheduleData 
    });
  } catch (error: any) {
    console.error('Generate matches error:', error);
    return NextResponse.json({ error: 'Failed to generate matches', details: error.message }, { status: 500 });
  }
}

// DELETE - Delete a schedule
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await sql`DELETE FROM match_schedules WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete schedule error:', error);
    return NextResponse.json({ error: 'Failed to delete schedule', details: error.message }, { status: 500 });
  }
}
