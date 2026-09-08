/// <reference types="google.maps" />
import type { Stop } from "./types";

// The Routes API's computeRouteMatrix caps a single request the same way
// the legacy Distance Matrix service did: 25x25 (a product of origins x
// destinations no greater than 625, no greater than 50 combined as plain
// coordinates). Plenty for the realistic use case here; if you need more
// stops, batch this into tiles.
const MAX_ELEMENTS_PER_SIDE = 25;

export interface DistanceDurationMatrix {
  distanceMeters: number[][];
  durationSeconds: number[][];
}

export async function buildDistanceMatrix(
  routeMatrix: typeof google.maps.routes.RouteMatrix,
  stops: Stop[]
): Promise<DistanceDurationMatrix> {
  if (stops.length > MAX_ELEMENTS_PER_SIDE) {
    throw new Error(
      `QuickMap currently supports up to ${MAX_ELEMENTS_PER_SIDE} stops (including the central point) at once.`
    );
  }

  const locations = stops.map((s) => ({ lat: s.lat, lng: s.lng }));

  const { matrix } = await routeMatrix.computeRouteMatrix({
    origins: locations,
    destinations: locations,
    travelMode: "DRIVING",
    fields: ["distanceMeters", "durationMillis", "condition"],
  });

  const distanceMeters: number[][] = [];
  const durationSeconds: number[][] = [];

  for (const row of matrix.rows) {
    const distRow: number[] = [];
    const durRow: number[] = [];
    for (const item of row.items) {
      const found = item.condition === "ROUTE_EXISTS";
      distRow.push(found && item.distanceMeters != null ? item.distanceMeters : Number.POSITIVE_INFINITY);
      durRow.push(found && item.durationMillis != null ? item.durationMillis / 1000 : 0);
    }
    distanceMeters.push(distRow);
    durationSeconds.push(durRow);
  }

  return { distanceMeters, durationSeconds };
}
