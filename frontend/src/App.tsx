import { useMemo, useRef, useState } from "react";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
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
import type { AddressCandidate, RouteResult, Stop } from "./lib/types";
import "./App.css";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as
  | string
  | undefined;

function newId(): string {
  return crypto.randomUUID();
}

function QuickMapApp() {
  const geocodingLibrary = useMapsLibrary("geocoding");
  const routesLibrary = useMapsLibrary("routes");

  const geocoder = useMemo(
    () => (geocodingLibrary ? new geocodingLibrary.Geocoder() : null),
    [geocodingLibrary]
  );
  const distanceMatrixService = useMemo(
    () =>
      routesLibrary ? new routesLibrary.DistanceMatrixService() : null,
    [routesLibrary]
  );

  const [centralPoint, setCentralPoint] = useState<Stop | null>(null);
  const [candidates, setCandidates] = useState<AddressCandidate[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crawling, setCrawling] = useState(false);
  const [busy, setBusy] = useState(false);

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
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
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
      setError((err as Error).message);
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
      setError((err as Error).message);
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
      setError((err as Error).message);
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
          setError((err as Error).message);
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
    if (!distanceMatrixService) {
      setError("Map isn't ready yet — try again in a moment.");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const allStops = [centralPoint, ...stops];
      const { distanceMeters, durationSeconds } = await buildDistanceMatrix(
        distanceMatrixService,
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
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>QuickMap</h1>
        <p>Scan a page for addresses, then get the shortest route to visit them all.</p>
      </header>

      <div className="app__body">
        <aside className="app__sidebar">
          <UrlCrawlForm onSubmit={handleCrawl} loading={crawling} />
          <CentralPointInput
            centralPoint={centralPoint}
            onSetByAddress={handleSetCentralByAddress}
            onUseCurrentLocation={handleUseCurrentLocation}
            loading={busy}
          />
          <AddressCandidateList
            candidates={candidates}
            onToggle={handleToggleCandidate}
            onAddManual={handleAddManual}
          />
          <button
            className="app__optimize"
            onClick={handleOptimize}
            disabled={busy || !centralPoint || stops.length === 0}
          >
            {busy ? "Working…" : "Optimize route"}
          </button>
          {error && <p className="app__error">{error}</p>}
          {route && <RouteOrderSummary route={route} />}
          {route && (
            <label className="app__debug-toggle">
              <input
                type="checkbox"
                checked={showDebug}
                onChange={(e) => setShowDebug(e.target.checked)}
              />
              Show debug table
            </label>
          )}
          {route && showDebug && <DebugTable route={route} />}
        </aside>

        <main className="app__map">
          <MapView
            centralPoint={centralPoint}
            stops={stops}
            route={route}
            onMapClick={handleMapClick}
          />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="app__config-error">
        <h1>QuickMap</h1>
        <p>
          Missing <code>VITE_GOOGLE_MAPS_API_KEY</code>. Copy{" "}
          <code>.env.example</code> to <code>.env.local</code> and fill in
          your API key.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <QuickMapApp />
    </APIProvider>
  );
}
