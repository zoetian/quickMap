export interface Stop {
  id: string;
  label: string;
  lat: number;
  lng: number;
  letter: string; // stable identifier shown on the map + route summary, e.g. "A", "C" for the central point
}

export interface AddressCandidate {
  id: string;
  text: string;
  selected: boolean;
  letter: string;
}

export interface RouteResult {
  orderedStops: Stop[]; // starts and ends with the central point
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  legDistances: number[]; // distance of each leg, orderedStops[i] -> orderedStops[i+1]
}
