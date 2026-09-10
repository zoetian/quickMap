import { useEffect, useMemo, useRef, useState } from "react";
import {
  APILoadingStatus,
  APIProvider,
  useApiLoadingStatus,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { ApiKeyPrompt } from "./components/ApiKeyPrompt";
import { LandingHero } from "./components/LandingHero";
import { UrlCrawlForm } from "./components/UrlCrawlForm";
import { AddressCandidateList } from "./components/AddressCandidateList";
import { CentralPointInput } from "./components/CentralPointInput";
import { MapView } from "./components/MapView";
import { DebugTable } from "./components/DebugTable";
import { RouteOrderSummary } from "./components/RouteOrderSummary";
import { crawlUrlForAddresses } from "./lib/crawlApi";
import { geocodeAddress, reverseGeocode } from "./lib/geocoding";
import { buildDistanceMatrix } from "./lib/distanceMatrix";
import { solveTsp } from "./lib/tsp";
import { CENTRAL_POINT_LETTER, stopLetterForIndex } from "./lib/labels";
import {
  clearStoredApiKey,
  getStoredApiKey,
  setStoredApiKey,
} from "./lib/apiKeyStorage";
import { isQuotaExceededError } from "./lib/quotaError";
import type { AddressCandidate, RouteResult, Stop } from "./lib/types";
import "./App.css";

// AdvancedMarkerElement (replacing the deprecated google.maps.Marker)
// requires a Map ID. "DEMO_MAP_ID" is Google's public placeholder for
// local development — set VITE_GOOGLE_MAPS_MAP_ID to a real Map ID
// (Cloud Console → Google Maps Platform → Map Management) before
// deploying to production. Unlike the API key, a Map ID isn't a secret
// and doesn't drive billing on its own, so it's fine to bake into the build.
const GOOGLE_MAPS_MAP_ID =
  (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined) ??
  "DEMO_MAP_ID";

// A shared, tightly-restricted key so visitors can try QuickMap before
// bringing their own. It's restricted by HTTP referrer to this site and
// has a daily request quota capped in Cloud Console per API — once that's
// hit, Google itself starts rejecting calls, which we detect below and
// use to prompt for the visitor's own key. Not a per-visitor limit, just
// a shared bucket for the whole site each day.
const GOOGLE_MAPS_DEMO_KEY = import.meta.env.VITE_GOOGLE_MAPS_DEMO_KEY as
  | string
  | undefined;

function newId(): string {
  return crypto.randomUUID();
}

interface QuickMapAppProps {
  usingOwnKey: boolean;
  onClearApiKey: () => void;
  onQuotaExceeded: () => void;
}

function QuickMapApp({
  usingOwnKey,
  onClearApiKey,
  onQuotaExceeded,
}: QuickMapAppProps) {
  const geocodingLibrary = useMapsLibrary("geocoding");
  const routesLibrary = useMapsLibrary("routes");
  const apiLoadingStatus = useApiLoadingStatus();

  const geocoder = useMemo(
    () => (geocodingLibrary ? new geocodingLibrary.Geocoder() : null),
    [geocodingLibrary]
  );

  const [centralPoint, setCentralPoint] = useState<Stop | null>(null);
  const [candidates, setCandidates] = useState<AddressCandidate[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crawling, setCrawling] = useState(false);
  const [busy, setBusy] = useState(false);

  // If the shared demo key is misconfigured or has exhausted its Cloud
  // Console quota badly enough that the map script itself fails to load,
  // fall back to prompting for the visitor's own key the same way a
  // per-call quota error does.
  useEffect(() => {
    if (
      !usingOwnKey &&
      (apiLoadingStatus === APILoadingStatus.FAILED ||
        apiLoadingStatus === APILoadingStatus.AUTH_FAILURE)
    ) {
      onQuotaExceeded();
    }
  }, [apiLoadingStatus, usingOwnKey, onQuotaExceeded]);

  function reportError(err: unknown) {
    if (!usingOwnKey && isQuotaExceededError(err)) {
      onQuotaExceeded();
    } else {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const nextLetterIndexRef = useRef(0);
  function assignNextLetter(): string {
    const letter = stopLetterForIndex(nextLetterIndexRef.current);
    nextLetterIndexRef.current += 1;
    return letter;
  }

  async function handleCrawl(url: string) {
    setError(null);
    setCrawling(true);
    try {
      const addresses = await crawlUrlForAddresses(url);
      if (addresses.length === 0) {
        setError("Didn't find anything that looks like an address on that page.");
      }
      setCandidates((prev) => [
        ...prev,
        ...addresses.map((text) => ({
          id: newId(),
          text,
          selected: false,
          letter: assignNextLetter(),
        })),
      ]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCrawling(false);
    }
  }

  async function handleToggleCandidate(id: string) {
    const candidate = candidates.find((c) => c.id === id);
    if (!candidate) return;

    if (candidate.selected) {
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, selected: false } : c))
      );
      setStops((prev) => prev.filter((s) => s.id !== id));
      setRoute(null);
      return;
    }

    if (!geocoder) {
      setError("Map isn't ready yet — try again in a moment.");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const { lat, lng, formattedAddress } = await geocodeAddress(
        geocoder,
        candidate.text
      );
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, selected: true } : c))
      );
      setStops((prev) => [
        ...prev,
        { id, label: formattedAddress, lat, lng, letter: candidate.letter },
      ]);
      setRoute(null);
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  function handleDeleteCandidate(id: string) {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
    setStops((prev) => prev.filter((s) => s.id !== id));
    setRoute(null);
  }

  async function handleAddManual(text: string) {
    if (!geocoder) {
      setError("Map isn't ready yet — try again in a moment.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { lat, lng, formattedAddress } = await geocodeAddress(
        geocoder,
        text
      );
      const id = newId();
      const letter = assignNextLetter();
      setCandidates((prev) => [
        ...prev,
        { id, text: formattedAddress, selected: true, letter },
      ]);
      setStops((prev) => [
        ...prev,
        { id, label: formattedAddress, lat, lng, letter },
      ]);
      setRoute(null);
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleMapClick(lat: number, lng: number) {
    if (!geocoder) return;
    setError(null);
    setBusy(true);
    try {
      const label = await reverseGeocode(geocoder, lat, lng);
      const id = newId();
      const letter = assignNextLetter();
      setCandidates((prev) => [
        ...prev,
        { id, text: label, selected: true, letter },
      ]);
      setStops((prev) => [...prev, { id, label, lat, lng, letter }]);
      setRoute(null);
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleSetCentralByAddress(address: string) {
    if (!geocoder) return;
    setError(null);
    setBusy(true);
    try {
      const { lat, lng, formattedAddress } = await geocodeAddress(
        geocoder,
        address
      );
      setCentralPoint({
        id: "central",
        label: formattedAddress,
        lat,
        lng,
        letter: CENTRAL_POINT_LETTER,
      });
      setRoute(null);
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  function handleUseCurrentLocation() {
    if (!geocoder) return;
    if (!navigator.geolocation) {
      setError("Your browser doesn't support geolocation.");
      return;
    }
    setError(null);
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        try {
          const label = await reverseGeocode(geocoder, lat, lng);
          setCentralPoint({
            id: "central",
            label,
            lat,
            lng,
            letter: CENTRAL_POINT_LETTER,
          });
          setRoute(null);
        } catch (err) {
          reportError(err);
        } finally {
          setBusy(false);
        }
      },
      () => {
        setError("Couldn't get your location — check browser permissions.");
        setBusy(false);
      }
    );
  }

  async function handleOptimize() {
    if (!centralPoint) {
      setError("Set a central point first.");
      return;
    }
    if (stops.length === 0) {
      setError("Add at least one stop first.");
      return;
    }
    if (!routesLibrary) {
      setError("Map isn't ready yet — try again in a moment.");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const allStops = [centralPoint, ...stops];
      const { distanceMeters, durationSeconds } = await buildDistanceMatrix(
        routesLibrary.RouteMatrix,
        allStops
      );
      const { order, totalDistance } = solveTsp(distanceMeters);

      const orderedStops = order.map((i) => allStops[i]);
      const legDistances: number[] = [];
      let totalDuration = 0;
      for (let i = 0; i < order.length - 1; i++) {
        legDistances.push(distanceMeters[order[i]][order[i + 1]]);
        totalDuration += durationSeconds[order[i]][order[i + 1]];
      }

      setRoute({
        orderedStops,
        totalDistanceMeters: totalDistance,
        totalDurationSeconds: totalDuration,
        legDistances,
      });
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  function handleChangeApiKey() {
    if (
      confirm(
        "Clear your saved API key? You'll need to re-enter it, and your current stops/route will be lost."
      )
    ) {
      onClearApiKey();
    }
  }

  const changeKeyButton = (
    <button
      type="button"
      className="change-key-button"
      onClick={handleChangeApiKey}
    >
      {usingOwnKey ? "Change API key" : "Use your own API key"}
    </button>
  );

  if (!route) {
    return (
      <>
        {changeKeyButton}
        <LandingHero
          mapId={GOOGLE_MAPS_MAP_ID}
          centralPoint={centralPoint}
          candidates={candidates}
          stops={stops}
          busy={busy}
          crawling={crawling}
          error={error}
          onCrawl={handleCrawl}
          onSetCentralByAddress={handleSetCentralByAddress}
          onUseCurrentLocation={handleUseCurrentLocation}
          onToggleCandidate={handleToggleCandidate}
          onDeleteCandidate={handleDeleteCandidate}
          onAddManual={handleAddManual}
          onOptimize={handleOptimize}
        />
      </>
    );
  }

  return (
    <div className="app">
      {changeKeyButton}
      <div className="app__body">
        <aside className="app__sidebar">
          <div className="app__brand">QuickMap</div>
          <CentralPointInput
            centralPoint={centralPoint}
            onSetByAddress={handleSetCentralByAddress}
            onUseCurrentLocation={handleUseCurrentLocation}
            loading={busy}
          />
          <AddressCandidateList
            candidates={candidates}
            onToggle={handleToggleCandidate}
            onDelete={handleDeleteCandidate}
            onAddManual={handleAddManual}
          />
          <div>
            <h3>Or scan a page for addresses</h3>
            <UrlCrawlForm onSubmit={handleCrawl} loading={crawling} />
          </div>
          <button
            className="app__optimize"
            onClick={handleOptimize}
            disabled={busy || !centralPoint || stops.length === 0}
          >
            {busy ? "Working…" : "Re-optimize route"}
          </button>
          {error && <p className="app__error">{error}</p>}
          <RouteOrderSummary route={route} />
          <label className="app__debug-toggle">
            <input
              type="checkbox"
              checked={showDebug}
              onChange={(e) => setShowDebug(e.target.checked)}
            />
            Show debug table
          </label>
          {showDebug && <DebugTable route={route} />}
        </aside>

        <main className="app__map">
          <MapView
            mapId={GOOGLE_MAPS_MAP_ID}
            centralPoint={centralPoint}
            stops={stops}
            route={route}
            onMapClick={handleMapClick}
            onRouteError={reportError}
          />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [ownApiKey, setOwnApiKey] = useState<string | null>(() =>
    getStoredApiKey()
  );
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  function handleSubmitApiKey(key: string) {
    setStoredApiKey(key);
    setOwnApiKey(key);
    setQuotaExceeded(false);
  }

  function handleClearApiKey() {
    clearStoredApiKey();
    setOwnApiKey(null);
  }

  const usingOwnKey = ownApiKey !== null;
  const effectiveApiKey =
    ownApiKey ?? (quotaExceeded ? null : GOOGLE_MAPS_DEMO_KEY ?? null);

  if (!effectiveApiKey) {
    return (
      <ApiKeyPrompt
        onSubmit={handleSubmitApiKey}
        reason={quotaExceeded ? "quota" : "none"}
      />
    );
  }

  return (
    <APIProvider apiKey={effectiveApiKey} key={effectiveApiKey}>
      <QuickMapApp
        usingOwnKey={usingOwnKey}
        onClearApiKey={handleClearApiKey}
        onQuotaExceeded={() => setQuotaExceeded(true)}
      />
    </APIProvider>
  );
}
