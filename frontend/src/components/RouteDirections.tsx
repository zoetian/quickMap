import { useEffect, useRef } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import type { Stop } from "../lib/types";

interface Props {
  orderedStops: Stop[]; // starts and ends with the central point
}

/** Renders a driving-directions polyline through the stops in the exact
 *  order given (our TSP solver already decided the order, so we ask the
 *  Directions API to just draw it, not re-optimize it). */
export function RouteDirections({ orderedStops }: Props) {
  const map = useMap();
  const routesLibrary = useMapsLibrary("routes");
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!map || !routesLibrary) return;
    const renderer = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true,
    });
    rendererRef.current = renderer;
    return () => renderer.setMap(null);
  }, [map, routesLibrary]);

  useEffect(() => {
    if (!routesLibrary || !rendererRef.current) return;
    if (orderedStops.length < 2) return;

    const directionsService = new routesLibrary.DirectionsService();
    const [origin, ...rest] = orderedStops;
    const destination = rest[rest.length - 1];
    const waypoints = rest.slice(0, -1).map((stop) => ({
      location: { lat: stop.lat, lng: stop.lng },
      stopover: true,
    }));

    directionsService
      .route({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        waypoints,
        optimizeWaypoints: false,
        travelMode: google.maps.TravelMode.DRIVING,
      })
      .then((result) => rendererRef.current?.setDirections(result))
      .catch((err) => console.error("Directions request failed:", err));
  }, [routesLibrary, orderedStops]);

  return null;
}
