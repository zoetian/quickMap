import { useEffect, useRef } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import type { Stop } from "../lib/types";

interface Props {
  orderedStops: Stop[]; // starts at the central point; does not return to it
  onError?: (err: unknown) => void;
}

/** Draws a driving-route polyline through the stops in the exact order
 *  given (our TSP solver already decided the order; we just draw it).
 *  The Routes API has no drop-in renderer like the old DirectionsRenderer,
 *  so this fetches the route and draws the polyline(s) itself. */
export function RouteDirections({ orderedStops, onError }: Props) {
  const map = useMap();
  const routesLibrary = useMapsLibrary("routes");
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  function clearPolylines() {
    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current = [];
  }

  useEffect(() => clearPolylines, []);

  useEffect(() => {
    if (!map || !routesLibrary) return;
    if (orderedStops.length < 2) return;

    clearPolylines();

    const [origin, ...rest] = orderedStops;
    const destination = rest[rest.length - 1];
    const intermediates = rest.slice(0, -1).map((stop) => ({
      location: { lat: stop.lat, lng: stop.lng },
    }));

    let cancelled = false;

    routesLibrary.Route.computeRoutes({
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      intermediates,
      optimizeWaypointOrder: false,
      travelMode: "DRIVING",
      fields: ["path"],
    })
      .then(({ routes }) => {
        if (cancelled || !routes || routes.length === 0) return;
        const polylines = routes[0].createPolylines({
          polylineOptions: { strokeColor: "#5b7fdb", strokeWeight: 4 },
        });
        polylines.forEach((polyline) => polyline.setMap(map));
        polylinesRef.current = polylines;
      })
      .catch((err) => {
        console.error("computeRoutes failed:", err);
        if (!cancelled) onErrorRef.current?.(err);
      });

    return () => {
      cancelled = true;
    };
  }, [map, routesLibrary, orderedStops]);

  return null;
}
