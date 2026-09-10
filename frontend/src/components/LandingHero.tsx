import { MapView } from "./MapView";
import { CentralPointInput } from "./CentralPointInput";
import { UrlCrawlForm } from "./UrlCrawlForm";
import { AddressCandidateList } from "./AddressCandidateList";
import type { AddressCandidate, Stop } from "../lib/types";

interface Props {
  mapId: string;
  centralPoint: Stop | null;
  candidates: AddressCandidate[];
  stops: Stop[];
  busy: boolean;
  crawling: boolean;
  error: string | null;
  onCrawl: (url: string) => void;
  onSetCentralByAddress: (address: string) => void;
  onUseCurrentLocation: () => void;
  onToggleCandidate: (id: string) => void;
  onDeleteCandidate: (id: string) => void;
  onAddManual: (text: string) => void;
  onOptimize: () => void;
}

export function LandingHero({
  mapId,
  centralPoint,
  candidates,
  stops,
  busy,
  crawling,
  error,
  onCrawl,
  onSetCentralByAddress,
  onUseCurrentLocation,
  onToggleCandidate,
  onDeleteCandidate,
  onAddManual,
  onOptimize,
}: Props) {
  return (
    <div className="landing">
      <div className="landing__map-bg" aria-hidden="true">
        <MapView
          mapId={mapId}
          centralPoint={centralPoint}
          stops={stops}
          route={null}
          interactive={false}
        />
      </div>
      <div className="landing__scrim" />

      <div className="landing__content">
        <div className="hero-card">
          <h1 className="hero-card__title">QuickMap</h1>
          <p className="hero-card__subtitle">
            Scan a page for addresses, then get the shortest route to visit
            them all.
          </p>

          <CentralPointInput
            centralPoint={centralPoint}
            onSetByAddress={onSetCentralByAddress}
            onUseCurrentLocation={onUseCurrentLocation}
            loading={busy}
          />
          <AddressCandidateList
            candidates={candidates}
            onToggle={onToggleCandidate}
            onDelete={onDeleteCandidate}
            onAddManual={onAddManual}
          />
          <div>
            <h3>Or scan a page for addresses</h3>
            <UrlCrawlForm onSubmit={onCrawl} loading={crawling} />
          </div>

          {error && <p className="app__error">{error}</p>}

          <button
            className="app__optimize"
            onClick={onOptimize}
            disabled={busy || !centralPoint || stops.length === 0}
          >
            {busy ? "Working…" : "Find best route"}
          </button>
        </div>
      </div>
    </div>
  );
}
