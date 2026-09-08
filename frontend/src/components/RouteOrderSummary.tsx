import type { RouteResult } from "../lib/types";

interface Props {
  route: RouteResult;
}

export function RouteOrderSummary({ route }: Props) {
  return (
    <div className="route-summary">
      <h3>Route order</h3>
      <p className="route-summary__trail">
        {route.orderedStops.map((s) => s.letter).join(" → ")}
      </p>
      <ol className="route-summary__list">
        {route.orderedStops.map((stop, i) => (
          <li key={`${stop.id}-${i}`}>
            <div className="route-summary__row">
              <span className="route-summary__badge">{stop.letter}</span>
              <span>{stop.label}</span>
            </div>
            {i < route.orderedStops.length - 1 && (
              <div className="route-summary__arrow" aria-hidden="true">
                ↓
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
