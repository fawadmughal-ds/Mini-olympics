// Games pricing for Mini Olympics 2026

export interface GamePrice {
  name: string;
  boys: number | null;
  girls: number | null;
  boysPlayers?: number;
  girlsPlayers?: number;
}

export const gamesPricing: GamePrice[] = [
  { name: 'Cricket', boys: 2200, girls: 1200, boysPlayers: 11, girlsPlayers: 5 },
  { name: 'Football', boys: 2200, girls: 1200, boysPlayers: 11, girlsPlayers: 6 },
  { name: 'Double Wicket', boys: 500, girls: null, boysPlayers: 2 },
  { name: 'Badminton Singles', boys: 200, girls: 200 },
  { name: 'Badminton Doubles', boys: 400, girls: 200, boysPlayers: 2, girlsPlayers: 2 },
  { name: 'Table Tennis Singles', boys: 200, girls: null },
  { name: 'Table Tennis Doubles', boys: 400, girls: 400, boysPlayers: 2, girlsPlayers: 2 },
  { name: 'Foosball Doubles', boys: 400, girls: 400, boysPlayers: 2, girlsPlayers: 2 },
  { name: 'Ludo Singles', boys: 150, girls: 150 },
  { name: 'Ludo Doubles', boys: 300, girls: 300, boysPlayers: 2, girlsPlayers: 2 },
  { name: 'Carrom Singles', boys: 150, girls: 150 },
  { name: 'Carrom Doubles', boys: 250, girls: 250, boysPlayers: 2, girlsPlayers: 2 },
  { name: 'Darts Singles', boys: 150, girls: 150 },
  { name: 'Tug of War', boys: 1000, girls: 600, boysPlayers: 10, girlsPlayers: 6 },
  { name: 'Jenga', boys: 150, girls: 150 },
  { name: 'Chess', boys: 150, girls: 150 },
  { name: 'Arm Wrestling', boys: 150, girls: null },
  { name: 'Pitho Gol Garam', boys: 1000, girls: null, boysPlayers: 6 },
  { name: 'Uno', boys: 100, girls: null },
  { name: 'Tekken', boys: 300, girls: 300 },
  { name: 'Fifa', boys: 300, girls: 300 },
];

/**
 * Normalize game name for Basant discount lookup:
 * lowercase, trim, single space, and treat singular/plural the same
 * (e.g. "Darts Singles" and "Darts single" → "darts single", "FIFA" and "Fifa" → "fifa").
 */
function normalizeGameName(name: string): string {
  let key = name.toLowerCase().trim().replace(/\s+/g, ' ');
  key = key.replace(/\bsingles\b/g, 'single').replace(/\bdoubles\b/g, 'double');
  return key;
}

/**
 * Basant discount percentage (0–50) per game. One key per game; lookup uses
 * normalized name (FIFA/Fifa, Darts Singles/Darts single, Table Tennis Doubles/Table tennis double all match).
 */
const BASANT_DISCOUNT_PERCENT: Record<string, number> = {
  '100m race': 25,
  '3 leg race': 30,
  'archery': 50,
  'arm wrestling': 30,
  'badminton double': 15,
  'badminton single': 15,
  'basketball': 50,
  'blur racing': 30,
  'cod': 40,
  'carrom double': 30,
  'carrom single': 30,
  'chess': 15,
  'clash royale': 20,
  'cricket': 20,
  'darts single': 30,
  'darts double': 30,
  'egg relay race': 50,
  'fifa': 20,
  'football double': 40,
  'football single': 40,
  'frisbee': 50,
  'gol gappay eating challenge': 15,
  'handball': 50,
  'hockey': 50,
  'jenga': 20,
  'kabaddi': 30,
  'ludo double': 20,
  'ludo single': 20,
  'piano tiles': 30,
  'plank': 20,
  'pubg': 20,
  'pucket': 30,
  'relay race': 40,
  'rifle shooting': 20,
  'rope jump': 30,
  "rubik's cube": 30,
  'squid game': 15,
  'swimming': 50,
  'subway surfer': 30,
  'table tennis double': 20,
  'table tennis single': 20,
  'tekken': 20,
  'thula': 20,
  'tug of war': 30,
  'uno': 30,
  'volley ball': 50,
  '1v1 penalty': 30,
};

/**
 * Returns Basant discount percentage (0–50) for a game, or 0 if no discount.
 * Works with any game list (static or from API); lookup is by normalized name.
 */
export function getBasantDiscountPercent(gameName: string): number {
  const key = normalizeGameName(gameName);
  return BASANT_DISCOUNT_PERCENT[key] ?? 0;
}

/**
 * Returns price after Basant discount for a game. Uses getGamePrice for base price.
 * If no discount or no price, returns same as getGamePrice (or null).
 */
export function getGamePriceAfterDiscount(gameName: string, gender: 'boys' | 'girls'): number | null {
  const base = getGamePrice(gameName, gender);
  if (base === null) return null;
  const pct = getBasantDiscountPercent(gameName);
  if (pct <= 0) return base;
  const discounted = Math.round(base * (1 - pct / 100));
  return discounted;
}

export interface TotalWithDiscountBreakdown {
  gameName: string;
  actual: number;
  discountPercent: number;
  afterDiscount: number;
}

export interface TotalWithDiscountResult {
  totalActual: number;
  totalAfterDiscount: number;
  breakdown: TotalWithDiscountBreakdown[];
}

/**
 * Calculates total with per-game Basant discount. Use totalAfterDiscount as the amount to charge.
 */
export function calculateTotalWithDiscount(
  selectedGames: string[],
  gender: 'boys' | 'girls',
  getGamePriceFn: (name: string, g: 'boys' | 'girls') => number | null = getGamePrice
): TotalWithDiscountResult {
  let totalActual = 0;
  let totalAfterDiscount = 0;
  const breakdown: TotalWithDiscountBreakdown[] = [];

  selectedGames.forEach((gameName) => {
    const actual = getGamePriceFn(gameName, gender);
    if (actual === null) return;
    const pct = getBasantDiscountPercent(gameName);
    const afterDiscount = pct > 0 ? Math.round(actual * (1 - pct / 100)) : actual;
    totalActual += actual;
    totalAfterDiscount += afterDiscount;
    breakdown.push({ gameName, actual, discountPercent: pct, afterDiscount });
  });

  return { totalActual, totalAfterDiscount, breakdown };
}

export function getGamePrice(gameName: string, gender: 'boys' | 'girls'): number | null {
  const game = gamesPricing.find((g) => g.name === gameName);
  if (!game) return null;
  return gender === 'boys' ? game.boys : game.girls;
}

export function getAvailableGames(gender: 'boys' | 'girls'): GamePrice[] {
  return gamesPricing.filter((game) => {
    return gender === 'boys' ? game.boys !== null : game.girls !== null;
  });
}

export function calculateTotal(selectedGames: string[], gender: 'boys' | 'girls'): number {
  let total = 0;
  selectedGames.forEach((gameName) => {
    const price = getGamePrice(gameName, gender);
    if (price !== null) {
      total += price;
    }
  });
  return total;
}

export function getRequiredPlayers(gameName: string, gender: 'boys' | 'girls'): number | null {
  const game = gamesPricing.find((g) => g.name === gameName);
  if (!game) return null;
  return gender === 'boys' ? (game.boysPlayers || null) : (game.girlsPlayers || null);
}

export function isTeamGame(gameName: string, gender: 'boys' | 'girls'): boolean {
  const requiredPlayers = getRequiredPlayers(gameName, gender);
  return requiredPlayers !== null && requiredPlayers > 1;
}

