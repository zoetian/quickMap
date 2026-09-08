export interface Stop {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export interface AddressCandidate {
  id: string;
  text: string;
  selected: boolean;
}

export interface RouteResult {
  orderedStops: Stop[]; // starts and ends with the central point
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  legDistances: number[]; // distance of each leg, orderedStops[i] -> orderedStops[i+1]
}
