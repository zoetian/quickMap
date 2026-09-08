/// <reference types="google.maps" />
import type { Stop } from "./types";

// The Maps JavaScript API's DistanceMatrixService caps a single request at
// 25 origins and 25 destinations. That's plenty for the realistic use case
// here; if you need more stops, batch this into tiles.
const MAX_ELEMENTS_PER_SIDE = 25;

export interface DistanceDurationMatrix {
  distanceMeters: number[][];
  durationSeconds: number[][];
}

export async function buildDistanceMatrix(
  service: google.maps.DistanceMatrixService,
  stops: Stop[]
): Promise<DistanceDurationMatrix> {
  if (stops.length > MAX_ELEMENTS_PER_SIDE) {
    throw new Error(
      `QuickMap currently supports up to ${MAX_ELEMENTS_PER_SIDE} stops (including the central point) at once.`
    );
  }

  const locations = stops.map((s) => ({ lat: s.lat, lng: s.lng }));

  const response = await service.getDistanceMatrix({
    origins: locations,
    destinations: locations,
    travelMode: google.maps.TravelMode.DRIVING,
    unitSystem: google.maps.UnitSystem.METRIC,
  });

  const distanceMeters: number[][] = response.rows.map((row) =>
    row.elements.map((el) =>
      el.status === "OK" ? el.distance.value : Number.POSITIVE_INFINITY
    )
  );
  const durationSeconds: number[][] = response.rows.map((row) =>
    row.elements.map((el) => (el.status === "OK" ? el.duration.value : 0))
  );

  return { distanceMeters, durationSeconds };
}
