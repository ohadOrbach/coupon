// Playful "savings rank" derived from the total ₪ value of active coupons.
// Everyone starts as the puppy; the more value you hoard, the scarier you get.

export type Rank = {
  level: 1 | 2 | 3;
  name: string;
  image: string; // filename in /public (served under the app's base URL)
};

// Ordered high to low so the first match wins.
const RANKS: { min: number; rank: Rank }[] = [
  { min: 1000, rank: { level: 3, name: 'הורסת המשפחות', image: 'level3.jpg' } },
  { min: 300, rank: { level: 2, name: 'חזרזירת ההנחות', image: 'level2.jpg' } },
  { min: 0, rank: { level: 1, name: 'גור הקופונים', image: 'level1.jpg' } },
];

export function rankForTotal(total: number): Rank {
  const match = RANKS.find((r) => total >= r.min);
  // total is always >= 0, so the `min: 0` entry guarantees a match.
  return (match ?? RANKS[RANKS.length - 1]).rank;
}
