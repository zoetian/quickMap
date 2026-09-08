// Solves the "start at index 0, visit every other stop exactly once"
// problem — an open path, not a closed loop. The central point is the
// fixed start; the route ends at whichever stop makes the total trip
// shortest, with no leg back to the start.
//
// - n <= EXACT_LIMIT: exact Held-Karp dynamic program.
// - larger n: nearest-neighbor construction + 2-opt local search.
// Good enough for the realistic use case here (a handful to a few dozen
// stops); not meant to scale to hundreds of nodes.

export interface TspResult {
  order: number[]; // indices into the distance matrix, starting at 0; does not return to 0
  totalDistance: number;
}

const EXACT_LIMIT = 13;

function tourLength(order: number[], dist: number[][]): number {
  let total = 0;
  for (let i = 0; i < order.length - 1; i++) {
    total += dist[order[i]][order[i + 1]];
  }
  return total;
}

function heldKarp(dist: number[][]): TspResult {
  const n = dist.length;
  const numSubsets = 1 << n;
  // dp[mask][i] = shortest path visiting `mask` (bitset of stops, always
  // includes 0), ending at stop i.
  const dp: number[][] = Array.from({ length: numSubsets }, () =>
    new Array(n).fill(Infinity)
  );
  const parent: number[][] = Array.from({ length: numSubsets }, () =>
    new Array(n).fill(-1)
  );

  dp[1][0] = 0; // start at node 0, having visited only {0}

  for (let mask = 1; mask < numSubsets; mask++) {
    if (!(mask & 1)) continue; // every valid subset must include the start
    for (let last = 0; last < n; last++) {
      if (!(mask & (1 << last))) continue;
      const cur = dp[mask][last];
      if (cur === Infinity) continue;

      for (let next = 1; next < n; next++) {
        if (mask & (1 << next)) continue;
        const nextMask = mask | (1 << next);
        const candidate = cur + dist[last][next];
        if (candidate < dp[nextMask][next]) {
          dp[nextMask][next] = candidate;
          parent[nextMask][next] = last;
        }
      }
    }
  }

  const fullMask = numSubsets - 1;
  let bestEnd = 0;
  let bestCost = 0;
  if (n > 1) {
    bestCost = Infinity;
    for (let i = 1; i < n; i++) {
      if (dp[fullMask][i] < bestCost) {
        bestCost = dp[fullMask][i];
        bestEnd = i;
      }
    }
  }

  const order: number[] = [];
  let mask = fullMask;
  let cur = bestEnd;
  while (cur !== -1) {
    order.push(cur);
    const prev = parent[mask][cur];
    mask ^= 1 << cur;
    cur = prev;
  }
  order.reverse();

  return { order, totalDistance: bestCost };
}

function nearestNeighborTour(dist: number[][]): number[] {
  const n = dist.length;
  const visited = new Array(n).fill(false);
  visited[0] = true;
  const order = [0];

  for (let step = 1; step < n; step++) {
    const last = order[order.length - 1];
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < n; i++) {
      if (visited[i]) continue;
      if (dist[last][i] < bestDist) {
        bestDist = dist[last][i];
        best = i;
      }
    }
    visited[best] = true;
    order.push(best);
  }

  return order;
}

function twoOpt(initialOrder: number[], dist: number[][]): number[] {
  let order = initialOrder.slice();
  const n = order.length;
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 1; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = order[i - 1];
        const b = order[i];
        const c = order[j];
        const hasTail = j + 1 < n;
        const d = hasTail ? order[j + 1] : -1;

        const before = dist[a][b] + (hasTail ? dist[c][d] : 0);
        const after = dist[a][c] + (hasTail ? dist[b][d] : 0);

        if (after < before - 1e-9) {
          const reversed = order.slice(i, j + 1).reverse();
          order = [...order.slice(0, i), ...reversed, ...order.slice(j + 1)];
          improved = true;
        }
      }
    }
  }

  return order;
}

export function solveTsp(dist: number[][]): TspResult {
  const n = dist.length;
  if (n === 0) return { order: [], totalDistance: 0 };
  if (n === 1) return { order: [0], totalDistance: 0 };

  if (n <= EXACT_LIMIT) {
    return heldKarp(dist);
  }

  const initial = nearestNeighborTour(dist);
  const improved = twoOpt(initial, dist);
  return { order: improved, totalDistance: tourLength(improved, dist) };
}
