import type { RouteResult } from "../lib/types";

interface Props {
  route: RouteResult;
}

function formatKm(meters: number): string {
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function DebugTable({ route }: Props) {
  return (
    <div className="debug-table">
      <h3>Optimized route</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Stop</th>
            <th>Leg distance</th>
          </tr>
        </thead>
        <tbody>
          {route.orderedStops.map((stop, i) => (
            <tr key={`${stop.id}-${i}`}>
              <td>{`${i}-${stop.letter}`}</td>
              <td>{stop.label}</td>
              <td>{i > 0 ? formatKm(route.legDistances[i - 1]) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="debug-table__total">
        Total: {formatKm(route.totalDistanceMeters)} · roughly{" "}
        {formatDuration(route.totalDurationSeconds)} driving
      </p>
    </div>
  );
}
