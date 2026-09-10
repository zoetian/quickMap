import { AdvancedMarker, Map, Pin, type MapMouseEvent } from "@vis.gl/react-google-maps";
import type { Stop, RouteResult } from "../lib/types";
import { RouteDirections } from "./RouteDirections";

interface Props {
  mapId: string;
  centralPoint: Stop | null;
  stops: Stop[];
  route: RouteResult | null;
  onMapClick?: (lat: number, lng: number) => void;
  /** Set false for a decorative, non-interactive background map (no
   *  controls, no gestures, no click-to-add). Defaults to true. */
  interactive?: boolean;
  onRouteError?: (err: unknown) => void;
}

const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 }; // roughly center of the US

export function MapView({
  mapId,
  centralPoint,
  stops,
  route,
  onMapClick,
  interactive = true,
  onRouteError,
}: Props) {
  function handleClick(e: MapMouseEvent) {
    if (onMapClick && e.detail.latLng) {
      onMapClick(e.detail.latLng.lat, e.detail.latLng.lng);
    }
  }

  return (
    <Map
      className="map-view"
      mapId={mapId}
      defaultCenter={centralPoint ?? DEFAULT_CENTER}
      defaultZoom={centralPoint ? 12 : 4}
      onClick={interactive ? handleClick : undefined}
      disableDefaultUI={!interactive}
      gestureHandling={interactive ? undefined : "none"}
      keyboardShortcuts={interactive}
    >
      {centralPoint && (
        <AdvancedMarker position={centralPoint} title={centralPoint.label}>
          <Pin
            background="#1a1a2e"
            borderColor="#0c0d12"
            glyphColor="#fff"
            glyphText={centralPoint.letter}
          />
        </AdvancedMarker>
      )}
      {stops.map((stop) => {
        const orderIndex = route
          ? route.orderedStops.findIndex((s) => s.id === stop.id)
          : -1;
        return (
          <AdvancedMarker
            key={stop.id}
            position={stop}
            title={orderIndex >= 0 ? `#${orderIndex} — ${stop.label}` : stop.label}
          >
            <Pin
              background="#5b7fdb"
              borderColor="#3f5bb0"
              glyphColor="#fff"
              glyphText={stop.letter}
            />
          </AdvancedMarker>
        );
      })}
      {route && (
        <RouteDirections
          orderedStops={route.orderedStops}
          onError={onRouteError}
        />
      )}
    </Map>
  );
}
