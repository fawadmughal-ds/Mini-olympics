import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch all games pricing (public - no auth needed)
export async function GET(request: NextRequest) {
  try {
    const games = await sql`
      SELECT id, game_name, gender, price, players
      FROM games_pricing
      ORDER BY game_name ASC, gender ASC
    `;

    // Transform to match the frontend format
    const gamesMap: Record<string, { name: string; boys: number | null; girls: number | null; boysPlayers?: number; girlsPlayers?: number }> = {};
    
    (games as any[]).forEach((g: any) => {
      const name = g.game_name;
      if (!gamesMap[name]) {
        gamesMap[name] = { name, boys: null, girls: null };
      }
      if (g.gender === 'boys') {
        gamesMap[name].boys = parseFloat(g.price);
        if (g.players) gamesMap[name].boysPlayers = g.players;
      } else if (g.gender === 'girls') {
        gamesMap[name].girls = parseFloat(g.price);
        if (g.players) gamesMap[name].girlsPlayers = g.players;
      }
    });

    const formattedGames = Object.values(gamesMap);

    return NextResponse.json({ success: true, data: formattedGames });
  } catch (error: any) {
    console.error('Fetch games error:', error);
    return NextResponse.json({ error: 'Failed to fetch games', details: error.message }, { status: 500 });
  }
}
