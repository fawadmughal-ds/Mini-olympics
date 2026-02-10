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
 * Normalize game name for discount lookup: lowercase, trim, single space.
 */
function normalizeGameName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/** No discount (0%) – Gol Gappa Eating Challenge only. */
const NO_DISCOUNT_KEYS = new Set([
  'gol gappa eating challenge',
  'gol gappay eating challenge',
]);

/** 50% discount – Swimming, Handball, Volleyball, Hockey. */
const FIFTY_PERCENT_KEYS = new Set([
  'swimming',
  'handball',
  'volleyball',
  'volley ball',
  'hockey',
]);

/**
 * Returns discount percentage for a game:
 * - 0% for Gol Gappa Eating Challenge
 * - 50% for Swimming, Handball, Volleyball, Hockey
 * - 30% for all other games
 */
export function getDiscountPercent(gameName: string): number {
  const key = normalizeGameName(gameName);
  if (NO_DISCOUNT_KEYS.has(key)) return 0;
  if (FIFTY_PERCENT_KEYS.has(key)) return 50;
  return 30;
}

/**
 * Returns price after discount for a game. Uses getGamePrice for base price.
 */
export function getGamePriceAfterDiscount(gameName: string, gender: 'boys' | 'girls'): number | null {
  const base = getGamePrice(gameName, gender);
  if (base === null) return null;
  const pct = getDiscountPercent(gameName);
  if (pct <= 0) return base;
  return Math.round(base * (1 - pct / 100));
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
 * Calculates total with per-game discount (0% / 30% / 50%). Use totalAfterDiscount as the amount to charge and for payment slip.
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
    const pct = getDiscountPercent(gameName);
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

