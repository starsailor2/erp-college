// Deterministic PRNG (mulberry32). Each demo-data module creates its own
// independent instance via createRng(seed) rather than sharing one global
// generator - with route-based code splitting, different navigation paths
// import (and first-evaluate) demo-data modules in different orders, so a
// single shared counter would make "the same seed" produce different
// values depending on which page loads first. A private instance per
// module keeps each domain's generated data stable regardless of
// navigation order.
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  next: () => number;
  pick: <T>(arr: readonly T[]) => T;
  randomInt: (min: number, max: number) => number;
  shuffle: <T>(arr: readonly T[]) => T[];
  weightedPick: <T>(entries: readonly [T, number][]) => T;
}

export function createRng(seed: number): Rng {
  const next = mulberry32(seed);

  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)];

  const randomInt = (min: number, max: number): number =>
    min + Math.floor(next() * (max - min + 1));

  const shuffle = <T>(arr: readonly T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const weightedPick = <T>(entries: readonly [T, number][]): T => {
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let r = next() * total;
    for (const [value, weight] of entries) {
      r -= weight;
      if (r <= 0) return value;
    }
    return entries[entries.length - 1][0];
  };

  return { next, pick, randomInt, shuffle, weightedPick };
}
