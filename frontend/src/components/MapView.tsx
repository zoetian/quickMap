import { Map, Marker, type MapMouseEvent } from "@vis.gl/react-google-maps";
import type { Stop, RouteResult } from "../lib/types";
import { RouteDirections } from "./RouteDirections";

interface Props {
  centralPoint: Stop | null;
  stops: Stop[];
  route: RouteResult | null;
  onMapClick: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 }; // roughly center of the US

export function MapView({ centralPoint, stops, route, onMapClick }: Props) {
  function handleClick(e: MapMouseEvent) {
    if (e.detail.latLng) {
      onMapClick(e.detail.latLng.lat, e.detail.latLng.lng);
    }
  }

  return (
    <Map
      className="map-view"
      defaultCenter={centralPoint ?? DEFAULT_CENTER}
      defaultZoom={centralPoint ? 12 : 4}
      onClick={handleClick}
      disableDefaultUI={false}
    >
      {centralPoint && (
        <Marker
          position={centralPoint}
          title={centralPoint.label}
          label={{ text: "C", color: "white" }}
        />
      )}
      {stops.map((stop, i) => {
        const orderIndex = route
          ? route.orderedStops.findIndex((s) => s.id === stop.id)
          : -1;
        return (
          <Marker
            key={stop.id}
            position={stop}
            title={stop.label}
            label={orderIndex > 0 ? String(orderIndex) : String(i + 1)}
          />
        );
      })}
      {route && <RouteDirections orderedStops={route.orderedStops} />}
    </Map>
  );
}
