// Stable, human-readable labels for stops: "C" is reserved for the central
// point, and every other stop gets the next letter in sequence (skipping
// "C") in the order it was added — and keeps that letter for its lifetime,
// even if other stops are added or removed around it, so users can always
// trace an optimized-route entry back to what they typed in.

const LETTER_POOL = "ABDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function stopLetterForIndex(index: number): string {
  const cycle = Math.floor(index / LETTER_POOL.length);
  const letter = LETTER_POOL[index % LETTER_POOL.length];
  return cycle === 0 ? letter : `${letter}${cycle + 1}`;
}

export const CENTRAL_POINT_LETTER = "C";
